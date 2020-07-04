const apiSchema = {
  paths: {
    '/clients': {},
    '/other': {},
    '/rpc/authenticate': {}
  },
  definitions: {
    clients: {
      properties: {
        id: {
          type: 'integer',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        name: {},
        age: {},
        level: {},
        arr: {},
        nestedField: {},
        new: {}
      }
    }
  }
}

const clientsData = [
  {
    id: 1,
    name: 'Test Client 1'
  },
  {
    id: 2,
    name: 'Test Client 2'
  },
  {
    id: 3,
    name: 'Test Client 3'
  }
]

const pkSchema = {
  paths: {},
  definitions: {
    no_pk: {
      properties: {
        age: {
          type: 'integer',
          description: 'This is not a primary key.'
        }
      }
    },
    simple_pk: {
      properties: {
        id: {
          type: 'integer',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        age: {
          type: 'integer',
          description: 'This is not a primary key.'
        }
      }
    },
    composite_pk: {
      properties: {
        id: {
          type: 'integer',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        name: {
          type: 'text',
          description: 'Note:\nThis is a Primary Key.<pk/>'
        },
        age: {
          type: 'integer',
          description: 'This is not a primary key.'
        }
      }
    }
  }
}

export default async req => {
  const url = req.url.replace('http://localhost', '')
  switch (url) {
    case '/':
    case '/api':
    case '/api/':
    case '/another-api':
    case '/another-api/':
      return {
        body: JSON.stringify(apiSchema),
        init: {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/openapi+json'
          }
        }
      }
    case '/pk-api':
    case '/pk-api2':
      return {
        body: JSON.stringify(pkSchema),
        init: {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/openapi+json'
          }
        }
      }
    case '/empty':
      return {
        body: JSON.stringify({}),
        init: {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'application/openapi+json'
          }
        }
      }
    case '/text':
      return {
        body: 'just some text',
        init: {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/csv'
          }
        }
      }
    case '/json':
      return {
        body: JSON.stringify({
          just: 'some',
          json: 'data'
        }),
        init: {
          status: 200,
          statusText: 'OK',
          headers: {
            'Content-Type': 'text/csv'
          }
        }
      }
    case '/404':
    case '/api/404':
      return {
        body: '{}',
        init: {
          status: 404,
          statusText: 'Not found',
          headers: {
            'Content-Type': 'application/json'
          }
        }
      }
    default:
      if (req.headers.get('Authorization') === 'Bearer expired-token') {
        return {
          body: '',
          init: {
            status: 401,
            headers: {
              'WWW-Authenticate': 'Bearer error="invalid_token", error_description="JWT expired"'
            }
          }
        }
      } else if (req.headers.get('Accept') === 'application/vnd.pgrst.object+json') {
        return {
          body: JSON.stringify(clientsData[0]),
          init: {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json'
            }
          }
        }
      } else {
        const rangeHeaders = {}
        if (req.headers.get('Range') || req.headers.get('Prefer')?.includes('count=exact')) {
          rangeHeaders['Range-Units'] = 'items'
          rangeHeaders['Content-Range'] = req.headers.get('Prefer')?.includes('count=exact') ? '0-/3' : '0-1/*'
        }
        return {
          body: JSON.stringify(clientsData),
          init: {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
              ...rangeHeaders
            }
          }
        }
      }
  }
}

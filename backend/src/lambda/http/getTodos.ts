import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { TodoService } from '../../service/todoService'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('get-todos')
const todoService = new TodoService()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const userId = getUserId(event)

  const items = await todoService.getTodosForUser(userId)

  logger.info('todos retrieved', items)

  return {
    statusCode: 200,
    body: JSON.stringify({ items })
  }
})

handler.use(cors({credentials: true}))


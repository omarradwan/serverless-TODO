import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { TodoService } from '../../service/todoService'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('sign-url')
const todoService = new TodoService()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const todoItem = await todoService.getTodoById(todoId)

  const userId = getUserId(event)
  
  if (userId !== todoItem.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({error: 'Unauthorized'})
    }
  }

  logger.info(`user ${userId} is authorized to upload attachment to todo`, todoItem)

  const uploadUrl = await todoService.getSignedUrlForAttachment(todoItem)

  logger.info(`url is signed: ${uploadUrl}`)

  return {
    statusCode: 200,
    body: JSON.stringify({uploadUrl})
  }
})

handler.use(cors({credentials: true}))

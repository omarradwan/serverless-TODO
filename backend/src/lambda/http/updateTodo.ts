import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { TodoService } from '../../service/todoService'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('update-todo')
const todoService = new TodoService()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)
  
  const todoItem = await todoService.getTodoById(todoId)

  const userId = getUserId(event)
  
  if (userId !== todoItem.userId) {
    return {
      statusCode: 403,
      body: JSON.stringify({error: 'Unauthorized'})
    }
  }

  logger.info(`user ${userId} is authorized to update todo`, todoItem)

  await todoService.updateTodo(todoItem, updatedTodo)

  return {
    statusCode: 204,
    body: ''
  }
})

handler.use(cors({credentials: true}))


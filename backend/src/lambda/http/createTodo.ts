import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { TodoService } from '../../service/todoService'
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'

const logger = createLogger('create-todo')
const todoService = new TodoService()

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  const userId = getUserId(event)

  const item = await todoService.createTodo(userId, newTodo)

  logger.info('new todo created', item)

  return {
    statusCode: 201,
    body: JSON.stringify({ item })
  }
})

handler.use(cors({credentials: true}))
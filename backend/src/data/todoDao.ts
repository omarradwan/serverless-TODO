
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'

const logger = createLogger('dao')
const XAWS = AWSXRay.captureAWS(AWS)

const todosTableName = process.env.TODOS_TABLE
const todoIdIndex = process.env.TODO_ID_INDEX

export class TodoDao {
    
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient()) {
    }

    async getTodosOfUser(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all todos for user with id: ${userId}`)
    
        const result = await this.docClient.query({
          TableName: todosTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
              ':userId': userId
          },
          ScanIndexForward: false
        }).promise()
    
        const items = result.Items
        return items as TodoItem[]
    }

    async createTodo(todoItem: TodoItem): Promise<TodoItem>{
        logger.info(`Creating new todo item: ${todoItem}`)

        await this.docClient.put({
            TableName: todosTableName,
            Item: todoItem
          }).promise()
      
          return todoItem
    }

    async updateTodo(updatedTodo: TodoItem): Promise<void>{
        logger.info(`Updating existing todo: ${updatedTodo}`)

        await this.docClient.put({
            TableName: todosTableName,
            Item: updatedTodo
          }).promise()    
    }

    async deleteTodo(userId: string, createdAt: string): Promise<void>{
        logger.info(`Deleting existing todo item owned by user with id: ${userId}`)
        
        await this.docClient.delete({
            TableName: todosTableName,
            Key: { userId, createdAt },
          }).promise()      
    }

    async getTodoById(id: string): Promise<TodoItem> {
        logger.info(`Getting todo item with id: ${id}`)

        const result = await this.docClient.query({
            TableName: todosTableName,
            IndexName: todoIdIndex,
            KeyConditionExpression: 'todoId = :id',
            ExpressionAttributeValues: {
                ':id': id
            },
          }).promise()
      
          if (result.Count !== 1) {
            logger.error(`todo item with id: ${id} not found`)
            throw new Error('todo not found')
          }
          const items = result.Items
          return items[0] as TodoItem
    }
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      logger.info('Creating a local DynamoDB instance')
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
    return new XAWS.DynamoDB.DocumentClient()
  }
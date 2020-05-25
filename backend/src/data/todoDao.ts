
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'

const XAWS = AWSXRay.captureAWS(AWS)

import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('auth')

export class TodoDao {

    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly TodosTableName = process.env.TODOS_TABLE,
        private readonly TodoIdIndex = process.env.TODO_ID_INDEX) {
    }

    async getTodosOfUser(userId: string): Promise<TodoItem[]> {
        logger.info(`Getting all todos for user with id: ${userId}`)
    
        const result = await this.docClient.query({
          TableName: this.TodosTableName,
          KeyConditionExpression: 'userId = :userId',
          ExpressionAttributeValues: {
              ':userId': userId
          },
          ScanIndexForward: false
        }).promise()
    
        const items = result.Items
        return items as TodoItem[]
      }

    async createTODO(todoItem: TodoItem): Promise<TodoItem>{
        logger.info(`Creating new todo item for user with id: ${todoItem.userId}`)

        await this.docClient.put({
            TableName: this.TodosTableName,
            Item: todoItem
          }).promise()
      
          return todoItem
    }

    async updateTODO(todoId: string, todoUpdate: TodoUpdate): Promise<TodoUpdate>{
        logger.info(`Updating existing todo item with id: ${todoId}`)

        const todoItem = await this.getTodoById(todoId)

        await this.docClient.update({
            TableName: this.TodosTableName,
            Key: { userId: todoItem.userId, createdAt: todoItem.createdAt },
            UpdateExpression: 'set name = :name, dueDate = :dueDate, done = :done',
            ExpressionAttributeValues: {
                ':name': todoUpdate.name,
                ':dueDate': todoUpdate.dueDate,
                ':done': todoUpdate.done
            }
          }).promise()
      
          return todoUpdate
    }

    async deleteTODO(todoId: string): Promise<void>{
        logger.info(`Deleting existing todo item with id: ${todoId}`)
        
        const todoItem = await this.getTodoById(todoId)

        await this.docClient.delete({
            TableName: this.TodosTableName,
            Key: { userId: todoItem.userId, createdAt: todoItem.createdAt },
          }).promise()      
    }

    async getTodoById(id: string): Promise<TodoItem> {
        logger.info(`Getting todo item with id: ${id}`)

        const result = await this.docClient.query({
            TableName: this.TodosTableName,
            IndexName: this.TodoIdIndex,
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
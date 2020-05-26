
import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import { TodoItem } from '../models/TodoItem'
import { createLogger } from '../utils/logger'
import { TodoUpdate } from '../models/TodoUpdate'

const logger = createLogger('auth')
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

    async updateTodo(todoId: string, todoUpdate: TodoUpdate): Promise<void>{
        logger.info(`Updating existing todo item with id: ${todoId}`)

        const oldItem = await this.getTodoById(todoId)

        await this.docClient.put({
            TableName: todosTableName,
            Item: this.getUpdatedTodoItem(oldItem, todoUpdate)
          }).promise()    
    }

    async deleteTodo(todoId: string): Promise<void>{
        logger.info(`Deleting existing todo item with id: ${todoId}`)
        
        const todoItem = await this.getTodoById(todoId)

        await this.docClient.delete({
            TableName: todosTableName,
            Key: { userId: todoItem.userId, createdAt: todoItem.createdAt },
          }).promise()      
    }

    private async getTodoById(id: string): Promise<TodoItem> {
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

    private getUpdatedTodoItem(oldItem: TodoItem, updates: TodoUpdate): object {
        logger.info(`updating todo: ${oldItem} with the following values: ${updates}`)

        let newItem = {}
        for (let key in updates) {
            if (updates[key]) {
                newItem[key] = updates[key]
            } else {
                newItem[key] = oldItem[key]
            }
        }

        logger.info(`updated todo is: ${newItem}`)

        return newItem
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
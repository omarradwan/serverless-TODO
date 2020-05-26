import * as uuid from 'uuid'

import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { TodoDao } from "../data/todoDao";
import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { S3 } from 'aws-sdk'
import { createLogger } from '../utils/logger';

const logger = createLogger('service')
const XAWS = AWSXRay.captureAWS(AWS)

const bucketName = process.env.ATTACHMENTS_BUCKET
const urlExpiration = process.env.SIGNED_URL_EXPIRATION

export class TodoService {

    constructor(
        private readonly todoDao: TodoDao = new TodoDao(),
        private readonly s3: S3 = new XAWS.S3({ signatureVersion: 'v4' })){
    }

    async getTodosForUser(userId: string): Promise<TodoItem[]>{
        return this.todoDao.getTodosOfUser(userId)
    }

    async createTodo(userId: string, todoRequest: CreateTodoRequest): Promise<TodoItem> {
        const todoItem: TodoItem = {
            userId,
            ...todoRequest,
            done: false,
            todoId: uuid.v4(),
            createdAt: new Date().toISOString()
        }

        return this.todoDao.createTodo(todoItem)
    }

    async updateTodo(oldItem: TodoItem, updates: UpdateTodoRequest) {
        logger.info(`updating todo: ${oldItem} with the following values: ${updates}`)

        let newItem = oldItem
        for (let key in updates) {
            if (updates[key]) {
                newItem[key] = updates[key]
            }
        }

        logger.info(`updated todo is: ${newItem}`)
        await this.todoDao.updateTodo(newItem)
    }

    async getSignedUrlForAttachment(todoItem: TodoItem): Promise<string> {
        const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoItem.todoId}`
        todoItem.attachmentUrl = attachmentUrl;
        await this.todoDao.updateTodo(todoItem)
        return this.getUploadUrl(todoItem.todoId)
    }

    async deleteTodo(userId: string, createdAt: string) {
        await this.todoDao.deleteTodo(userId, createdAt)
    }

    async getTodoById(todoId: string): Promise<TodoItem> {
        return await this.todoDao.getTodoById(todoId);
    }

    private getUploadUrl(imageId: string): string {
        return this.s3.getSignedUrl('putObject', {
          Bucket: bucketName,
          Key: imageId,
          Expires: urlExpiration
        })
    }
}
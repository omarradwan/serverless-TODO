import * as uuid from 'uuid'

import * as AWS  from 'aws-sdk'
import * as AWSXRay from 'aws-xray-sdk'
import { TodoDao } from "../data/todoDao";
import { TodoItem } from "../models/TodoItem";
import { CreateTodoRequest } from "../requests/CreateTodoRequest";
import { UpdateTodoRequest } from '../requests/UpdateTodoRequest';
import { S3 } from 'aws-sdk'

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

    async updateTodo(todoId: string, updatedTodo: UpdateTodoRequest) {
        await this.todoDao.updateTodo(todoId, {...updatedTodo})
    }

    async getSignedUrlForAttachment(todoId: string): Promise<string> {
        const attachmentUrl = `https://${bucketName}.s3.amazonaws.com/${todoId}`
        await this.todoDao.updateTodo(todoId, {attachmentUrl})
        return this.getUploadUrl(todoId)
    }

    async deleteTodo(todoId: string) {
        await this.todoDao.deleteTodo(todoId)
    }

    private getUploadUrl(imageId: string): string {
        return this.s3.getSignedUrl('putObject', {
          Bucket: bucketName,
          Key: imageId,
          Expires: urlExpiration
        })
    }
}
import { ObjectId } from 'mongodb';

export default class Message {
  constructor(public userName: string, public content: string, public type: string, public receiver?: string, public room?: string, public datetime?: number, public id?: ObjectId) {
    this.datetime = new Date().getTime() + (60 * 60 * 1000);
  }
}

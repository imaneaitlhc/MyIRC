import { ObjectId } from 'mongodb';
// User interface to enter in db
export default class User {
  public name: String;

  public password: String;

  public isAdmin: boolean;

  public id?: ObjectId;

  constructor(name: string, password: string, isAdmin: boolean = false) {
    this.name = name;
    this.password = password;
    this.isAdmin = isAdmin;
  }
}

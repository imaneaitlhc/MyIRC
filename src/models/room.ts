// import User from './user';

export default class Room {
  public nbUser: number;

  public name: string;

  public password?: string;

  constructor(name: string, password?: string) {
    this.nbUser = 0;
    this.name = name;
    if (password) this.password = password;
  }

  public checkPassword(password: string): boolean {
    if (!this.password) return true;
    return (this.password === password);
  }
}

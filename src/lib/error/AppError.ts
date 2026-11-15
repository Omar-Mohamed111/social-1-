export class AppError extends Error {

  constructor(public message:string,public statusCode:number, public error?:Error) {
    super(message);

    this.statusCode = statusCode;
    this.error = error;
  }
}

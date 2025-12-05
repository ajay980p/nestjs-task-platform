import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateUserDto, LoginUserDto } from '../../../libs/common/src/dto/create-user.dto';

@Injectable()
export class AppService {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
  ) { }

  // 1. Register Request Forward karna
  createUser(createUserDto: CreateUserDto) {
    return this.authClient.send({ cmd: 'register' }, createUserDto);
  }

  // 2. Login Request Forward karna
  login(loginUserDto: LoginUserDto) {
    return this.authClient.send({ cmd: 'login' }, loginUserDto);
  }
}
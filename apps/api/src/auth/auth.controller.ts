import { Body, Controller, Post } from '@nestjs/common';
import { z } from 'zod';
import { AuthService } from './auth.service';

const RegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().regex(/^\+[1-9]\d{6,14}$/, 'Phone must be E.164'),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'needs uppercase')
    .regex(/[a-z]/, 'needs lowercase')
    .regex(/\d/, 'needs digit'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  async register(@Body() body: unknown) {
    const data = RegisterSchema.parse(body);
    return this.auth.register(data);
  }

  @Post('login')
  async login(@Body() body: unknown) {
    const data = LoginSchema.parse(body);
    return this.auth.login(data.email, data.password);
  }
}

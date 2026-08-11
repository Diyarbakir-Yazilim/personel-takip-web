import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const testUser = {
    email: 'testuser@example.com',
    password: 'Password123!',
    fullName: 'Test User',
    role: 'STAFF',
    deviceId: 'device-uuid-123',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // main.ts ile aynı validasyon kurallarını aktif ediyoruz
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    app.setGlobalPrefix('v1');
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    // Her testten önce veritabanındaki test kullanıcısını temizleyelim
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: { email: testUser.email },
    });
    await app.close();
  });

  it('/v1/auth/register (POST) - should register a new user successfully', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send(testUser)
      .expect(201);

    expect(response.body).toHaveProperty('access_token');
    expect(response.body.user).toHaveProperty('email', testUser.email);
  });

  it('/v1/auth/login (POST) - should login successfully and return access token', async () => {
    // Önce kullanıcıyı kaydedelim
    await request(app.getHttpServer()).post('/v1/auth/register').send(testUser);

    // Giriş yapmayı deneyelim
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        deviceId: testUser.deviceId,
      })
      .expect(200);

    expect(response.body).toHaveProperty('access_token');
  });

  it('/v1/auth/login (POST) - should fail if deviceId does not match (Device Locking)', async () => {
    // Kullanıcıyı bir cihaz ID ile kaydedelim
    await request(app.getHttpServer()).post('/v1/auth/register').send(testUser);

    // Farklı bir cihaz ID ile giriş yapmayı deneyelim
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password,
        deviceId: 'different-device-id',
      })
      .expect(401);

    expect(response.body.message).toContain('This account is registered to another device');
  });
});
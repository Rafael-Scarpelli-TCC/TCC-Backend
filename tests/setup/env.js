process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'segredo-somente-para-testes';
delete process.env.MONGODB_URI;
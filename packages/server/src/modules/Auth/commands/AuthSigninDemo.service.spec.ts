import { AuthSigninService } from './AuthSignin.service';
import { InvalidEmailPasswordException } from '../exceptions/InvalidEmailPassword.exception';

describe('AuthSigninService, mode demo RBOOKS_DEMO_ANY_LOGIN', () => {
  const demoUser = {
    id: 7,
    email: 'demo@rbooks.test',
    password: 'hash',
    checkPassword: jest.fn().mockResolvedValue(false),
  } as any;

  const createService = () => {
    const findOne = jest.fn().mockImplementation((where: any) => {
      const found = where.email === 'demo@rbooks.test' ? demoUser : undefined;
      const result: any = found
        ? Promise.resolve(found)
        : Promise.reject(new Error('nf'));
      result.throwIfNotFound = () => result;
      return result;
    });
    const systemUserModel = { query: jest.fn(() => ({ findOne })) } as any;
    return new AuthSigninService(
      systemUserModel,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
    );
  };

  const saved = process.env.RBOOKS_DEMO_ANY_LOGIN;
  afterEach(() => {
    if (saved === undefined) delete process.env.RBOOKS_DEMO_ANY_LOGIN;
    else process.env.RBOOKS_DEMO_ANY_LOGIN = saved;
  });

  it('refuse un mauvais mot de passe quand la variable est absente', async () => {
    delete process.env.RBOOKS_DEMO_ANY_LOGIN;
    await expect(
      createService().signin('demo@rbooks.test', 'mauvais'),
    ).rejects.toBeInstanceOf(InvalidEmailPasswordException);
  });

  it('refuse un courriel inconnu quand la variable est absente', async () => {
    delete process.env.RBOOKS_DEMO_ANY_LOGIN;
    await expect(
      createService().signin('vendeur@test.ca', 'abc'),
    ).rejects.toBeInstanceOf(InvalidEmailPasswordException);
  });

  it('refuse quand la variable vaut autre chose que 1', async () => {
    process.env.RBOOKS_DEMO_ANY_LOGIN = '0';
    await expect(
      createService().signin('vendeur@test.ca', 'abc'),
    ).rejects.toBeInstanceOf(InvalidEmailPasswordException);
  });

  it('ouvre le compte de demo avec n importe quels identifiants quand la variable vaut 1', async () => {
    process.env.RBOOKS_DEMO_ANY_LOGIN = '1';
    demoUser.checkPassword.mockClear();
    const user = await createService().signin('vendeur@test.ca', 'abc');
    expect(user).toBe(demoUser);
    expect(demoUser.checkPassword).not.toHaveBeenCalled();
  });
});

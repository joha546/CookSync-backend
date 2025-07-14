const mockingoose = require('mockingoose');
const OTP = require('../../models/OTP');
const User = require('../../models/User')
const { sendOTP, verifyOTP } = require('../../controllers/authController');

jest.mock('../../utils/mailer', () => ({
  sendOTP: jest.fn().mockResolvedValue()
}));

const { sendOTP: mockSendMail } = require('../../utils/mailer');

describe('Auth Controlller', ()=> {
    let res;

    beforeEach(() =>{
        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };

        jest.clearAllMocks();
    });


    // Test sendOTP.
    describe('sendOTP()', () => {
        it('should return 400 if email is missing', async() =>{
            const req = {body: {}};
            await sendOTP(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Email is required.' });
        });

        it('should send OTP and return 200', async() =>{
            const req = {body: {email: 'test@example.com'}};

            mockingoose(OTP).toReturn(null, 'deleteMany');  // simulate deletion.
            mockingoose(OTP).toReturn({email: 'test@example.com', otp: '123456'}, 'save');

            await sendOTP(req, res);

            expect(mockSendMail).toHaveBeenCalledWith('test@example.com', expect.any(String));
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({message: 'OTP sent to email'});
        });
    });


    // Test verifyOTP();

    describe('verifyOTP()', () => {
        it('should return 400 if email or otp missing', async () => {
            const req = { body: { email: '', otp: '' } };
            await verifyOTP(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
        });

        it('should return 401 if OTP is invalid', async () => {
            const req = { body: { email: 'test@example.com', otp: '000000' } };
            mockingoose(OTP).toReturn(null, 'findOne');
            await verifyOTP(req, res);
            expect(res.status).toHaveBeenCalledWith(401);
        });

        it('should create user and return token if OTP is valid', async() => {
            const req = {
                body: {email: 'test@example.com', otp: '123456'}
            };

            process.env.JWT_SECRET = 'testsecret';

            mockingoose(OTP).toReturn({ email: 'test@example.com', otp: '123456' }, 'findOne');
            mockingoose(User).toReturn(null, 'findOne'); // no existing user
            mockingoose(User).toReturn({ _id: 'user123', email: 'test@example.com', role: 'user' }, 'create');

            await verifyOTP(req, res);

            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(
                expect.objectContaining({
                    token: expect.any(String),
                    user: expect.objectContaining({email: 'test@example.com'})
                })
            );
        });
    });
});

const mockingoose = require('mockingoose');
const User = require('../../models/User');
const Notification = require('../../models/Notification');
const {
  requestChef,
  listChefRequests,
  approveChef,
  toggleFavorite,
  getFavorites,
  updatePreferences,
  ProfilePage
} = require('../../controllers/userController');

const mongoose = require('mongoose');


describe('User Controller', () => {
  let req, res;
  const mockUserId = new mongoose.Types.ObjectId();
  const mockRecipeId = new mongoose.Types.ObjectId();

  beforeEach(() => {
    req = {
      user: {
        _id: mockUserId,
        id: mockUserId.toString(),
        email: 'user@example.com',
        role: 'user',
        favorites: [],
        chefRequest: { status: 'none' },
        preferences: {},
        save: jest.fn()
      },
      params: {},
      body: {},
      app: {
        get: () => ({ fetchSockets: jest.fn().mockResolvedValue([]) })
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe('requestChef()', () => {
    it('should return 400 if already approved chef', async () => {
      req.user.chefRequest.status = 'approved';
      await requestChef(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('should submit chef request', async () => {
      await requestChef(req, res);
      expect(req.user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Chef request submitted' });
    });
  });

    describe('listChefRequests()', () => {
    it('should return pending chef requests', async () => {
      mockingoose(User).toReturn([{ email: 'chef@example.com' }], 'find');
      await listChefRequests(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.any(Array));
    });
  });

  describe('approveChef()', () => {
    it('should return 404 if user not found', async () => {
      req.params.userId = mockUserId.toString();
      mockingoose(User).toReturn(null, 'findOne');
      await approveChef(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should approve chef and send notification', async () => {
      req.params.userId = mockUserId.toString();
      const userMock = {
        _id: mockUserId,
        email: 'user@example.com',
        chefRequest: { status: 'pending' },
        save: jest.fn()
      };
      mockingoose(User).toReturn(userMock, 'findOne');
      mockingoose(Notification).toReturn({}, 'create');

      await approveChef(req, res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Chef approved successfully' });
    });
  });

  describe('toggleFavorite()', () => {
    it('should add to favorites if not present', async () => {
      req.params.recipeId = mockRecipeId.toString();
      await toggleFavorite(req, res);
      expect(req.user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Recipe added to favorites' });
    });

    it('should remove from favorites if already present', async () => {
      req.user.favorites = [mockRecipeId.toString()];
      req.params.recipeId = mockRecipeId.toString();
      await toggleFavorite(req, res);
      expect(req.user.save).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ message: 'Recipe removed from favorites' });
    });
  });

  describe('getFavorites()', () => {
    it('should return user favorites', async () => {
      mockingoose(User).toReturn({ favorites: [{ title: 'Pizza' }] }, 'findOne');
      await getFavorites(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([{ title: 'Pizza' }]));
    });
  });

  describe('updatePreferences()', () => {
    it('should update preferences', async () => {
      req.body = { vegan: true };
      mockingoose(User).toReturn({ ...req.user, save: jest.fn(), preferences: {} }, 'findOne');

      await updatePreferences(req, res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Preferences updated'
      }));
    });
  });

  describe('ProfilePage()', () => {
    it('should return 404 if user not found', async () => {
      mockingoose(User).toReturn(null, 'findOne');
      await ProfilePage(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('should return user info', async () => {
      mockingoose(User).toReturn({ email: 'user@example.com' }, 'findOne');
      await ProfilePage(req, res);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ email: 'user@example.com' }));
    });
  });
});

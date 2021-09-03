const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');

const Profile = require('../../models/Profile');
const User = require('../../models/User');

// @route   GET api/profile/me
// @desc    get current user's profile
// @access  private
router.get('/me', auth, async (req, res) => {
	try {
		profile = await Profile.findOne({ user: req.user.id }).populate('user', [
			'name',
			'avatar',
		]);
		if (!profile) {
			return res.status(400).json({ msg: 'There is no profile for this user' });
		}
		res.json(profile);
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server error');
	}
});

// @route   POST api/profile
// @desc    create or update a user's profile
// @access  private
router.post(
	'/',
	[
		auth,
		check('status', 'Status is required').notEmpty(),
		check('skills', 'Skills are required').notEmpty(),
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		// destructure the request
		const {
			website,
			skills,
			youtube,
			twitter,
			instagram,
			linkedin,
			facebook,
			// spread the rest of the fields (need socials)
			...rest
		} = req.body;

		// build profile object (needs to match above)
		const profileFields = {
			user: req.user.id,
			website: website,
			skills: Array.isArray(skills)
				? skills
				: skills.split(',').map((skill) => ' ' + skill.trim()),
			...rest,
		};
		profileFields.social = {
			youtube: youtube ? youtube : null,
			twitter: twitter ? twitter : null,
			instagram: instagram ? instagram : null,
			linkedin: linkedin ? linkedin : null,
			facebook: facebook ? facebook : null,
		};

		try {
			let profile = await Profile.findOne({ user: req.user.id });
			// update if found
			if (profile) {
				profile = await Profile.findOneAndUpdate(
					{ user: req.user.id },
					{ $set: profileFields },
					{ new: true }
				);
				return res.json(profile);
			}
			// create if not found
			profile = new Profile(profileFields);
			await profile.save();
			res.json(profile);
		} catch (err) {
			console.log(err.message);
			return res.status(500).send('Server error');
		}

		console.log(profileFields);
		res.json(profileFields);
	}
);

// @route   GET api/profile
// @desc    get all profiles
// @access  public
router.get('/', async (req, res) => {
	try {
		const profiles = await Profile.find().populate('user', ['name', 'avatar']);
		res.json(profiles);
	} catch (err) {
		console.log(err.message);
		return res.status(500).send('Server error');
	}
});

// @route   GET api/profile/user/:user_id
// @desc    get profile by user id
// @access  public
router.get('/user/:user_id', async (req, res) => {
	try {
		const profile = await Profile.findOne({
			user: req.params.user_id,
		}).populate('user', ['name', 'avatar']);

		if (!profile) return res.status(400).json({ msg: 'Profile not found' });

		res.json(profile);
	} catch (err) {
		console.log(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found' });
		}
		return res.status(500).send('Server error');
	}
});

// @route   DELETE api/profile
// @desc    delete profile, user, and posts
// @access  private
router.delete('/', auth, async (req, res) => {
	try {
		// @todo - remove users posts

		// remove profile
		await Profile.findOneAndRemove({ user: req.user.id });
		// remove user
		await User.findOneAndRemove({ _id: req.user.id });

		res.json({ msg: 'User deleted' });
	} catch (err) {
		console.log(err.message);
		if (err.kind == 'ObjectId') {
			return res.status(400).json({ msg: 'Profile not found' });
		}
		return res.status(500).send('Server error');
	}
});

// @route   PUT api/profile/experience
// @desc    add profile experience
// @access  private
router.put(
	'/experience',
	[
		auth,
		[
			check('title', 'Title is required').notEmpty(),
			check('company', 'Company is required').notEmpty(),
			check('from', 'From date is required').notEmpty(),
		],
	],
	async (req, res) => {
		const errors = validationResult(req);
		if (!errors.isEmpty()) {
			return res.status(400).json({ errors: errors.array() });
		}

		const { title, company, from, ...rest } = req.body;

		const newExp = { title, company, from, ...rest };
		console.log(newExp);

		try {
			const profile = await Profile.findOne({ user: req.user.id });
			profile.experience.unshift(newExp);
			await profile.save();
			return res.json({ profile });
		} catch (err) {
			console.log(err.message);
			return res.status(500).send('Server error');
		}
	}
);

module.exports = router;

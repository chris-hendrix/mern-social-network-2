import axios from 'axios';
import { setAlert } from './alert';
import { REGISTER_SUCCESS, REGISTER_FAIL, USER_LOADED, AUTH_ERROR } from './types';
import setAuthToken from '../utils/setAuthToken';

// load user
export const loadUser = () => async (dispatch) => {
	if (localStorage.token) {
		setAuthToken(localStorage.token);
	}

	try {
		const res = await axios.get('/api/auth');
		console.log(res.data);
		dispatch({
			type: USER_LOADED,
			payload: res.data,
		});
	} catch (err) {
		dispatch({
			type: AUTH_ERROR,
		});
	}
};

// register user
export const register =
	({ name, email, password }) =>
	async (dispatch) => {
		/*TODO axios.post having JSON parse error with config
		const config = {
			headers: {
				'Content-Type': 'application/json',
			},
		};
        */
		// setting default is workaround
		axios.defaults.headers.post['Content-Type'] = 'application/json';
		const body = JSON.stringify({ name, email, password });

		try {
			const res = await axios.post('/api/users', body);
			dispatch({
				type: REGISTER_SUCCESS,
				payload: res.data,
			});
		} catch (err) {
			const errors = err.response.data.errors;
			if (errors) {
				errors.forEach((error) => dispatch(setAlert(error.msg, 'danger')));
			}
			dispatch({
				type: REGISTER_FAIL,
			});
		}
	};

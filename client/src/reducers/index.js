import { combineReducers } from 'redux';
import courseReducer from './courseReducer';
import userReducer from './userReducer';
import errorReducer from './errorReducer';



const reducers =  combineReducers({
  course: courseReducer,
  user: userReducer,
  errors: errorReducer
});

export default reducers
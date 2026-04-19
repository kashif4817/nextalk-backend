import supabase from "../config/supabase.js";
import {sendResponse} from '../utils/sendResponse.js';

export const authMiddleware = async (req, res, next) => {
  console.log("middleware hit");
console.log('req.headers :>> ', req.headers);
// const token = req.headers.authorization?.split(" ")[1];
const token = req.headers.bearer;
  console.log("token", token);

  if(!token) return  sendResponse(res,401,"user not authorized")

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
console.log('data, error :>> ', user, error);

if(error) return sendResponse(res,401  ,"Invalid or expired token")
  
  req.user={
    id:user.id
  }

  next();
};

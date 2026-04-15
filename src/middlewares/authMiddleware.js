import supabase from "../config/supabase.js";

export const authMiddleware = async (req, res, next) => {
  console.log("middleware hit");

//   const token = req.headers.authorization;
const token = req.headers.authorization?.split(" ")[1];
  console.log("token", token);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  
  req.user={
    id:data.id
  }

  next();
};

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
  console.log("user", user);
  console.log("token", token);

  req.id=user.id
  console.log('req.id', req.id)

  next();
};

// const token = req.headers.authorization?.split(" ")[1];

// req.user.id =

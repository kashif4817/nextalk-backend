import dotenv from 'dotenv'
dotenv.config();

export function validateEnv() {
    const requiredEnv = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "FRONTEND_URL",
        "PORT",
        "CLOUDINARY_CLOUD_NAME",
        "CLOUDINARY_API_KEY",
        "CLOUDINARY_API_SECRET",
    ];

    requiredEnv.forEach((key) => {
        if (!process.env[key]) {
            console.error(`Missing environment variable: ${key}`)
            process.exit(1)
        }
    });

}

import dotenv from 'dotenv'
dotenv.config();

export function validateEnv() {
    const requiredEnv = [
        "SUPABASE_URL",
        "SUPABASE_ANON_KEY",
        "FRONTEND_URL",
        "PORT"
    ];

    requiredEnv.forEach((key) => {
        if (!process.env[key]) {
            console.error(`Missing environment variable: ${key}`)
            process.exit(1)
        }
    });

}

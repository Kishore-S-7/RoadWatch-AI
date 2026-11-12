from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

url = os.getenv("MONGODB_URL", "")
db_name = os.getenv("MONGODB_DB_NAME", "roadwatch")

masked_url = url
if "@" in url:
    prefix = url.split("://")[0]
    host_part = url.split("@")[-1]
    masked_url = f"{prefix}://<credentials>@{host_part}"

print("==================================================")
print("Testing MongoDB Connection...")
print(f"Target: {masked_url}")
print(f"Database: {db_name}")
print("==================================================")

try:
    client = MongoClient(url, serverSelectionTimeoutMS=6000)
    client.admin.command("ping")
    print("\n>>> SUCCESS: MongoDB Connected Successfully! <<<")
    
    db = client[db_name]
    print(f"Collections in '{db_name}': {db.list_collection_names()}")
    client.close()

except Exception as err:
    err_str = str(err)
    print("\n>>> FAILED: Could not connect to MongoDB <<<")
    print(f"Error Details: {err_str}")
    
    if "bad auth" in err_str.lower() or "authentication failed" in err_str.lower():
        print("\n[DIAGNOSIS]: Authentication Failed (Atlas Error 8000)")
        print("- Your cluster is reachable, but the username or password was rejected.")
        print("- Please verify the password for your Atlas user in:")
        print("  MongoDB Atlas -> Security -> Database Access -> Edit User -> Edit Password")
    elif "serverselectiontimeouterror" in err_str.lower():
        print("\n[DIAGNOSIS]: Network Timeout")
        print("- Your computer could not reach the MongoDB cluster.")
        print("- In MongoDB Atlas, go to: Security -> Network Access -> Add IP Address -> Allow 0.0.0.0/0 (or current IP).")

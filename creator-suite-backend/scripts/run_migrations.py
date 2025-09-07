#!/usr/bin/env python3
import os
import sys
import subprocess
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def run_migrations():
    """Run Alembic migrations."""
    print("Running database migrations...")
    try:
        # Run the migration command
        subprocess.run(["alembic", "upgrade", "head"], check=True)
        print("Migrations completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error running migrations: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Make sure we're in the project root directory
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(project_root)
    
    run_migrations()
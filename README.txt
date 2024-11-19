# 1. Install MySQL (for WSL or Linux users)
sudo apt install mysql-server

# 2. Start and enable the MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# 3. Access MySQL as root user
sudo mysql -u root -p

# 4. Inside MySQL terminal, run the following commands:

# 4.1 Create a new MySQL user
CREATE USER 'edu_connect_user'@'localhost' IDENTIFIED BY 'your_password';

# 4.2 Create a new database
CREATE DATABASE edu_connect_db;

# 4.3 Grant all privileges to the user on the new database
GRANT ALL PRIVILEGES ON edu_connect_db.* TO 'edu_connect_user'@'localhost';

# 4.4 Grant global privileges for the user (to allow creating shadow databases)
GRANT ALL PRIVILEGES ON *.* TO 'edu_connect_user'@'localhost';

# 4.5 Flush privileges to apply the changes
FLUSH PRIVILEGES;

# 5. Exit MySQL terminal
EXIT;

# 6. Update your .env file in the client directory (example content)
# DATABASE_URL="mysql://edu_connect_user:your_password@localhost:3306/edu_connect_db"

# 7. Install Prisma and migrate the database
cd client
npm install prisma @prisma/client
npx prisma migrate dev --name init

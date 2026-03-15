# Secure & Share Govt Document with Family Members

## 1. Introduction

This project is a web-based application that allows citizens to store and share important government documents digitally. Instead of keeping physical copies, users can upload their documents online and share them securely with family members. The system links documents with the Aadhaar number, which is unique for every citizen. This reduces the risk of losing or damaging important documents and simplifies access when verification is required.

Example documents:

- Mark sheets
- PAN card
- Passport
- Aadhaar card
- Health records

## 2. Problem Statement

Many people face problems such as:

- Losing important documents
- Carrying physical copies everywhere
- Difficulty sharing documents with family members
- Government spending more money on document management

This project solves these problems by creating a digital document management system.

Key benefits:

- Safe storage of documents
- Easy sharing with family
- Reduced paperwork
- Faster verification

## 3. Aim of the Project

The aim of the project is:

- To digitally store government documents
- To securely share documents with family members
- To reduce the use of physical documents
- To create a safe and reliable online document system

## 4. Technologies Used

| Technology | Purpose |
| --- | --- |
| HTML | Structure of the web pages |
| CSS | Designing the user interface |
| JavaScript | Adding functionality and logic |
| Firebase | Database, authentication, and storage |

Firebase services used:

- Firebase Authentication: Login and OTP verification
- Firebase Firestore or Realtime Database: Store user data
- Firebase Storage: Store uploaded documents

## 5. Project Difficulty Level

The difficulty level is Medium because the system includes:

- Authentication
- File upload
- Secure sharing
- Database management
- Logging system

## 6. System Modules

### 6.1 User Registration Module

New users must register in the system.

Process:

- User enters: name, email, phone number, Aadhaar number, password
- System sends OTP verification
- User verifies OTP
- Account is created

### 6.2 Login Module

Registered users can log in.

Process:

- Enter email or phone and password
- System checks Firebase database
- If valid: user dashboard opens
- If invalid: error message shown

### 6.3 Upload Document Module

Users can upload their government documents.

Process:

- User clicks Upload Document
- Select file (PDF or image)
- Enter document details
- File uploaded to Firebase Storage
- Document information saved in database

Example documents:

- Aadhaar
- PAN
- Passport
- Certificates

### 6.4 Update / Delete Document Module

Users can manage their documents.

Update:

- Change document name
- Replace document file

Delete:

- Remove document permanently

### 6.5 Share Document Module

Users can share documents with family members.

Process:

- Select document
- Enter family member Aadhaar or email
- Grant permission
- Document becomes accessible to that person

This allows secure document sharing.

### 6.6 My Profile Module

Users can manage their profile.

Features:

- View personal details
- Update profile information
- Change password
- View uploaded documents

## 7. System Workflow (Process Flow)

1. User registers with Aadhaar number.
2. User verifies OTP.
3. User logs into the system.
4. User uploads documents.
5. Documents are stored securely in Firebase.
6. User can view, update, delete, or share documents with family members.

## 8. Database Structure

### 8.1 User Table

- User ID
- Name
- Email
- Phone
- Aadhaar number
- Password (stored securely)

### 8.2 Document Table

- Document ID
- User ID
- Document Name
- File Path
- Upload Date

### 8.3 Shared Documents

- Document ID
- Shared User ID
- Permission details

## 9. Logging System

The system records all activities.

Examples of logs:

- User login
- Document upload
- Document deletion
- Document sharing

Logging helps in:

- Tracking user actions
- Debugging errors
- Security monitoring

## 10. Coding Standards

The project follows good coding practices. The code should be:

- Safe: should not cause security issues
- Testable: easy to test
- Maintainable: easy to modify
- Portable: works on different systems

## 11. GitHub Requirement

The project must be uploaded to GitHub.

Requirements:

- Public repository
- Organized project structure
- Proper README file

README should include:

- Project description
- Setup instructions
- Workflow
- Execution steps

## 12. Deployment

The project can be deployed in different environments, for example:

- Cloud hosting
- Edge devices
- Local system

Deployment should include proper justification of system design.

## 13. Optimization

The system should be optimized at:

### 13.1 Code Level

- Efficient code
- Less redundancy

### 13.2 Architecture Level

- Proper system design
- Scalable database structure

## 14. Testing

Test cases to include in the project report:

| Test Case | Input | Expected Output |
| --- | --- | --- |
| Registration | Valid details | Account created |
| Login | Correct password | Login success |
| Upload document | Valid file | File uploaded |
| Share document | Valid user | Access granted |

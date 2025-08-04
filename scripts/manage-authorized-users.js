#!/usr/bin/env node

// Script to manage authorized users
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const AUTH_FILE = join(__dirname, '../src/lib/server/authorized-users.ts');

function readAuthFile() {
    const content = readFileSync(AUTH_FILE, 'utf-8');
    const match = content.match(/export const AUTHORIZED_USERS: AuthorizedUser\[\] = (\[[\s\S]*?\]);/);
    if (!match) {
        throw new Error('Could not parse authorized users file');
    }
    
    // Use Function constructor to safely evaluate the array
    const usersArray = new Function('return ' + match[1])();
    return usersArray;
}

function writeAuthFile(users) {
    const content = readFileSync(AUTH_FILE, 'utf-8');
    const usersList = users.map(user => {
        const roles = user.roles.map(r => `'${r}'`).join(', ');
        return `\t{
\t\temail: '${user.email}',
\t\troles: [${roles}],
\t\tname: '${user.name || user.email}'
\t}`;
    }).join(',\n');
    
    const newUsersList = `[\n${usersList}\n]`;
    const newContent = content.replace(
        /export const AUTHORIZED_USERS: AuthorizedUser\[\] = \[[\s\S]*?\];/,
        `export const AUTHORIZED_USERS: AuthorizedUser[] = ${newUsersList};`
    );
    
    writeFileSync(AUTH_FILE, newContent);
}

function listUsers() {
    console.log('\nAuthorized Users:');
    console.log('================\n');
    
    const users = readAuthFile();
    users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name || 'Not set'}`);
        console.log(`   Roles: ${user.roles.join(', ')}`);
        console.log('');
    });
}

function addUser(email, name, roles = ['author']) {
    const users = readAuthFile();
    
    // Check if user already exists
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        console.error(`User ${email} already exists`);
        return;
    }
    
    users.push({
        email,
        name: name || email,
        roles
    });
    
    writeAuthFile(users);
    console.log(`Added user: ${email}`);
}

function removeUser(email) {
    const users = readAuthFile();
    const filteredUsers = users.filter(u => u.email.toLowerCase() !== email.toLowerCase());
    
    if (filteredUsers.length === users.length) {
        console.error(`User ${email} not found`);
        return;
    }
    
    writeAuthFile(filteredUsers);
    console.log(`Removed user: ${email}`);
}

// Parse command line arguments
const [,, command, ...args] = process.argv;

switch (command) {
    case 'list':
        listUsers();
        break;
        
    case 'add':
        if (args.length < 1) {
            console.error('Usage: node manage-authorized-users.js add <email> [name] [role1,role2,...]');
            process.exit(1);
        }
        const [email, name, rolesStr] = args;
        const roles = rolesStr ? rolesStr.split(',') : ['author'];
        addUser(email, name, roles);
        break;
        
    case 'remove':
        if (args.length < 1) {
            console.error('Usage: node manage-authorized-users.js remove <email>');
            process.exit(1);
        }
        removeUser(args[0]);
        break;
        
    default:
        console.log('Authorized Users Management Script');
        console.log('==================================\n');
        console.log('Commands:');
        console.log('  list                                    - List all authorized users');
        console.log('  add <email> [name] [role1,role2,...]   - Add a new authorized user');
        console.log('  remove <email>                         - Remove an authorized user');
        console.log('\nExamples:');
        console.log('  node manage-authorized-users.js list');
        console.log('  node manage-authorized-users.js add john@example.com "John Doe" admin,author');
        console.log('  node manage-authorized-users.js remove john@example.com');
        console.log('\nDefault role is "author" if not specified.');
        console.log('Available roles: admin, author');
}
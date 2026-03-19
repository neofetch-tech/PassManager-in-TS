import Anthropic from "@anthropic-ai/sdk";
import * as readline from "readline";
import * as fs from "fs";
import * as crypto from "crypto";

interface PasswordEntry {
    id: string;
    site: string;
    username: string;
    password: string;
}

const DATA_FILE = "passwords.json";
const MASTER_PASSWORD = "masterpass123"; // Change this to something secure

function encrypt(text: string): string {
    const cipher = crypto.createCipher("aes-256-cbc", MASTER_PASSWORD);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    return encrypted;
}

function decrypt(text: string): string {
    const decipher = crypto.createDecipher("aes-256-cbc", MASTER_PASSWORD);
    let decrypted = decipher.update(text, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}

function loadPasswords(): PasswordEntry[] {
    if (!fs.existsSync(DATA_FILE)) return [];
    const data = fs.readFileSync(DATA_FILE, "utf8");
    return JSON.parse(data);
}

function savePasswords(entries: PasswordEntry[]): void {
    fs.writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
}

function addPassword(site: string, username: string, password: string): void {
    const entries = loadPasswords();
    entries.push({
        id: crypto.randomUUID(),
        site,
        username,
        password: encrypt(password),
    });
    savePasswords(entries);
    console.log("✓ Password added");
}

function listPasswords(): void {
    const entries = loadPasswords();
    if (entries.length === 0) {
        console.log("No passwords stored");
        return;
    }
    entries.forEach((entry) => {
        console.log(`Site: ${entry.site}, User: ${entry.username}`);
    });
}

function getPassword(site: string): void {
    const entries = loadPasswords();
    const entry = entries.find((e) => e.site === site);
    if (entry) {
        console.log(
            `Password for ${site}/${entry.username}: ${decrypt(entry.password)}`
        );
    } else {
        console.log("Password not found");
    }
}

function deletePassword(site: string): void {
    let entries = loadPasswords();
    entries = entries.filter((e) => e.site !== site);
    savePasswords(entries);
    console.log("✓ Password deleted");
}

function showMenu(): void {
    console.clear();
    console.log("=== Password Manager ===");
    console.log("1. Add password");
    console.log("2. List passwords");
    console.log("3. Get password");
    console.log("4. Delete password");
    console.log("5. Exit");
}

async function main(): Promise<void> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const question = (prompt: string): Promise<string> => {
        return new Promise((resolve) => {
            rl.question(prompt, resolve);
        });
    };

    let running = true;
    while (running) {
        showMenu();
        const choice = await question("\nChoose an option: ");

        switch (choice) {
            case "1":
                const site = await question("Site: ");
                const username = await question("Username: ");
                const password = await question("Password: ");
                addPassword(site, username, password);
                break;
            case "2":
                listPasswords();
                break;
            case "3":
                const getSite = await question("Site: ");
                getPassword(getSite);
                break;
            case "4":
                const delSite = await question("Site: ");
                deletePassword(delSite);
                break;
            case "5":
                running = false;
                break;
        }

        if (running) {
            await question("\nPress Enter to continue...");
        }
    }

    rl.close();
}

main();
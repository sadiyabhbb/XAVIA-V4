import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { resolve as resolvePath, join } from "path";
import { pathToFileURL } from "url";

const config = {
    name: "cmd",
    aliases: ["command", "plugin"],
    version: "2.0.0",
    description: "Manage bot commands - install, load, loadall, unload (fully fixed)",
    usage: "<install|load|loadall|unload>",
    credits: "Aryan Rayhan » Fixed & Improved by Grok",
    permissions: [2],
    cooldown: 3,
    nixprefix: true,
    vip: false
};

const langData = {
    "en_US": {
        "usage": "Usage:\n• cmd install <name.js> (reply with code or paste after filename)\n• cmd load <name>\n• cmd loadall\n• cmd unload <name>",
        "missingName": "Please provide a file name with .js extension.",
        "missingCode": "Please reply with the command code or paste it after the filename.",
        "install.success": "Successfully installed command: {name}",
        "install.failed": "Failed to install command: {error}",
        "load.success": "Successfully loaded command: {name}",
        "load.failed": "Failed to load command: {error}",
        "loadall.success": "Successfully loaded {count} commands",
        "loadall.failed": "Failed to load some commands",
        "unload.success": "Successfully unloaded command: {name}",
        "unload.notfound": "Command {name} not found or not loaded"
    }
};

const tempCommands = new Map();

async function onCall({ message, args, getLang }) {
    try {
        if (!args || args.length === 0) return message.reply(getLang("usage"));

        const action = args[0].toLowerCase();
        if (!["install", "load", "loadall", "unload"].includes(action)) {
            return message.reply(getLang("usage"));
        }

        // ==================== INSTALL ====================
        if (action === "install") {
            let fileName = args[1];
            let rawCode = "";

            // Case 1: Code in replied message (recommended)
            if (message.repliedMessage?.body) {
                rawCode = message.repliedMessage.body.trim();
            }
            // Case 2: Code pasted after filename in same message
            else if (args.length >= 3) {
                rawCode = args.slice(2).join(" ");
            }

            if (!fileName) return message.reply(getLang("missingName"));
            if (!rawCode) return message.reply(getLang("missingCode"));

            if (!fileName.endsWith(".js")) fileName += ".js";

            const cacheDir = resolvePath(global.pluginsPath, "commands", "cache");
            if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });

            const filePath = join(cacheDir, fileName);

            try {
                writeFileSync(filePath, rawCode, "utf-8");

                // Clear require cache to prevent old version loading
                const fullPath = require.resolve(filePath);
                delete require.cache[fullPath];

                const pluginURL = pathToFileURL(filePath);
                pluginURL.searchParams.set("v", Date.now().toString());

                const module = await import(pluginURL);
                let pluginExport = module.default || module;

                if (typeof pluginExport !== "object" || typeof pluginExport.onCall !== "function") {
                    writeFileSync(filePath, ""); // delete bad file
                    return message.reply(getLang("install.failed", { error: "Invalid format: Must export an object with 'onCall' function" }));
                }

                const cmdConfig = pluginExport.config || {
                    name: fileName.replace(".js", ""),
                    aliases: []
                };
                cmdConfig.category = "cache";

                const commandName = cmdConfig.name.toLowerCase();

                // Store in temp & global
                tempCommands.set(commandName, { onCall: pluginExport.onCall, config: cmdConfig, filePath });
                global.plugins.commands.set(commandName, pluginExport.onCall);
                global.plugins.commandsConfig.set(commandName, cmdConfig);
                global.plugins.commandsAliases.set(commandName, cmdConfig.aliases || [commandName]);

                return message.reply(getLang("install.success", { name: fileName }));
            } catch (err) {
                console.error("CMD Install Error:", err);
                return message.reply(getLang("install.failed", { error: err.message || err }));
            }
        }

        // ==================== LOAD ====================
        if (action === "load") {
            if (!args[1]) return message.reply("Usage: cmd load <command name>");

            const targetName = args[1].toLowerCase().replace(".js", "");
            const commandsPath = resolvePath(global.pluginsPath, "commands");

            try {
                const categories = readdirSync(commandsPath).filter(c => existsSync(join(commandsPath, c)));

                for (const category of categories) {
                    const catPath = join(commandsPath, category);
                    const files = readdirSync(catPath).filter(f => f.endsWith(".js"));

                    const file = files.find(f => f.toLowerCase().replace(".js", "") === targetName);
                    if (!file) continue;

                    const filePath = join(catPath, file);
                    const pluginURL = pathToFileURL(filePath);
                    pluginURL.searchParams.set("v", Date.now());

                    delete require.cache[require.resolve(filePath)];
                    const module = await import(pluginURL);
                    let pluginExport = module.default || module;

                    if (typeof pluginExport === "object" && typeof pluginExport.onCall === "function") {
                        const cmdConfig = pluginExport.config || { name: targetName, aliases: [] };
                        cmdConfig.category = category;

                        const cmdName = cmdConfig.name.toLowerCase();

                        global.plugins.commands.set(cmdName, pluginExport.onCall);
                        global.plugins.commandsConfig.set(cmdName, cmdConfig);
                        global.plugins.commandsAliases.set(cmdName, cmdConfig.aliases || [cmdName]);

                        return message.reply(getLang("load.success", { name: cmdName }));
                    }
                }
                return message.reply(getLang("load.failed", { error: "Command not found or invalid format" }));
            } catch (err) {
                console.error(err);
                return message.reply(getLang("load.failed", { error: err.message }));
            }
        }

        // ==================== LOADALL ====================
        if (action === "loadall") {
            const commandsPath = resolvePath(global.pluginsPath, "commands");
            let loaded = 0;

            try {
                const categories = readdirSync(commandsPath);

                for (const category of categories) {
                    if (["cache", "template", "example"].includes(category)) continue;

                    const catPath = join(commandsPath, category);
                    if (!existsSync(catPath)) continue;

                    const files = readdirSync(catPath).filter(f => f.endsWith(".js"));

                    for (const file of files) {
                        try {
                            const filePath = join(catPath, file);
                            const pluginURL = pathToFileURL(filePath);
                            pluginURL.searchParams.set("v", Date.now());

                            const module = await import(pluginURL);
                            let pluginExport = module.default || module;

                            if (typeof pluginExport === "object" && typeof pluginExport.onCall === "function") {
                                const cmdName = file.replace(".js", "").toLowerCase();
                                const cmdConfig = pluginExport.config || { name: cmdName, aliases: [] };
                                cmdConfig.category = category;

                                global.plugins.commands.set(cmdName, pluginExport.onCall);
                                global.plugins.commandsConfig.set(cmdName, cmdConfig);
                                global.plugins.commandsAliases.set(cmdName, cmdConfig.aliases || [cmdName]);
                                loaded++;
                            }
                        } catch (e) {
                            console.error(`Failed to load ${file}:`, e);
                        }
                    }
                }
                return message.reply(getLang("loadall.success", { count: loaded }));
            } catch (err) {
                console.error(err);
                return message.reply(getLang("loadall.failed"));
            }
        }

        // ==================== UNLOAD ====================
        if (action === "unload") {
            if (!args[1]) return message.reply("Usage: cmd unload <command name>");

            const cmdName = args[1].toLowerCase().replace(".js", "");

            if (global.plugins.commands.has(cmdName)) {
                global.plugins.commands.delete(cmdName);
                global.plugins.commandsConfig.delete(cmdName);
                global.plugins.commandsAliases.delete(cmdName);
                tempCommands.delete(cmdName);
                return message.reply(getLang("unload.success", { name: cmdName }));
            } else {
                return message.reply(getLang("unload.notfound", { name: cmdName }));
            }
        }

    } catch (error) {
        console.error("CMD Plugin Fatal Error:", error);
        return message.reply(`Fatal Error: ${error.message}`);
    }
}

export default {
    config,
    langData,
    onCall
};

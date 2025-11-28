import { writeFileSync, existsSync, readdirSync, mkdirSync } from "fs";
import { resolve as resolvePath, join } from "path";
import { pathToFileURL } from "url";

const config = {
    name: "cmd",
    aliases: ["command", "plugin"],
    version: "3.0.0",
    description: "Manage bot commands (fully fixed for pure ESM)",
    usage: "<install|load|loadall|unload>",
    credits: "Fixed by Grok",
    permissions: [2],
    cooldown: 3,
    nixprefix: true,
    vip: false
};

const langData = {
    "en_US": {
        "usage": "Usage:\n• cmd install <name.js> (reply with code)\n• cmd load <name>\n• cmd loadall\n• cmd unload <name>",
        "missingName": "Provide file name with .js",
        "missingCode": "Reply with the code or paste after filename",
        "install.success": "Successfully installed: {name}",
        "install.failed": "Install failed: {error}",
        "load.success": "Loaded: {name}",
        "load.failed": "Load failed: {error}",
        "loadall.success": "Loaded {count} commands",
        "loadall.failed": "Some commands failed to load",
        "unload.success": "Unloaded: {name}",
        "unload.notfound": "Command {name} not found"
    }
};

async function onCall({ message, args, getLang }) {
    try {
        if (!args?.length) return message.reply(getLang("usage"));
        const action = args[0].toLowerCase();

        if (!["install", "load", "loadall", "unload"].includes(action)) {
            return message.reply(getLang("usage"));
        }

        // ===================== INSTALL =====================
        if (action === "install") {
            let fileName = args[1];
            let code = "";

            if (message.repliedMessage?.body) {
                code = message.repliedMessage.body.trim();
            } else if (args.length >= 3) {
                code = args.slice(2).join(" ");
            }

            if (!fileName) return message.reply(getLang("missingName"));
            if (!code) return message.reply(getLang("missingCode"));
            if (!fileName.endsWith(".js")) fileName += ".js";

            const cacheDir = resolvePath(global.pluginsPath, "commands", "cache");
            if (!existsSync(cacheDir)) mkdirSync(cacheDir, { recursive: true });
            const filePath = join(cacheDir, fileName);

            try {
                writeFileSync(filePath, code, "utf-8");

                const fileUrl = pathToFileURL(filePath);
                fileUrl.searchParams.set("v", Date.now().toString());   // cache busting

                const module = await import(fileUrl.href);
                const plugin = module.default || module;

                if (typeof plugin !== "object" || typeof plugin.onCall !== "function") {
                    writeFileSync(filePath, ""); // delete bad file
                    return message.reply(getLang("install.failed", { error: "Must export object with onCall function" }));
                }

                const cmdConfig = plugin.config || { name: fileName.replace(".js", ""), aliases: [] };
                cmdConfig.category = "cache";
                const cmdName = cmdConfig.name.toLowerCase();

                global.plugins.commands.set(cmdName, plugin.onCall);
                global.plugins.commandsConfig.set(cmdName, cmdConfig);
                global.plugins.commandsAliases.set(cmdName, cmdConfig.aliases || [cmdName]);

                return message.reply(getLang("install.success", { name: fileName }));
            } catch (err) {
                console.error("Install error:", err);
                return message.reply(getLang("install.failed", { error: err.message }));
            }
        }

        // ===================== LOAD =====================
        if (action === "load" && args[1]) {
            const name = args[1].toLowerCase().replace(".js", "");
            const basePath = resolvePath(global.pluginsPath, "commands");

            try {
                const cats = readdirSync(basePath);
                for (const cat of cats) {
                    const catPath = join(basePath, cat);
                    if (!existsSync(catPath)) continue;
                    const files = readdirSync(catPath).filter(f => f.endsWith(".js"));
                    const file = files.find(f => f.toLowerCase().replace(".js", "") === name);
                    if (!file) continue;

                    const fileUrl = pathToFileURL(join(catPath, file));
                    fileUrl.searchParams.set("v", Date.now());

                    const module = await import(fileUrl.href);
                    const plugin = module.default || module;

                    if (typeof plugin.onCall === "function") {
                        const cfg = plugin.config || { name, aliases: [] };
                        cfg.category = cat;
                        const cmd = cfg.name.toLowerCase();

                        global.plugins.commands.set(cmd, plugin.onCall);
                        global.plugins.commandsConfig.set(cmd, cfg);
                        global.plugins.commandsAliases.set(cmd, cfg.aliases || [cmd]);

                        return message.reply(getLang("load.success", { name: cmd }));
                    }
                }
                return message.reply(getLang("load.failed", { error: "Not found" }));
            } catch (err) {
                return message.reply(getLang("load.failed", { error: err.message }));
            }
        }

        // ===================== LOADALL =====================
        if (action === "loadall") {
            let count = 0;
            const basePath = resolvePath(global.pluginsPath, "commands");

            try {
                const cats = readdirSync(basePath);
                for (const cat of cats) {
                    if (["cache", "template", "example"].includes(cat)) continue;
                    const catPath = join(basePath, cat);
                    if (!existsSync(catPath)) continue;

                    for (const file of readdirSync(catPath).filter(f => f.endsWith(".js"))) {
                        try {
                            const fileUrl = pathToFileURL(join(catPath, file));
                            fileUrl.searchParams.set("v", Date.now());

                            const module = await import(fileUrl.href);
                            const plugin = module.default || module;

                            if (typeof plugin.onCall === "function") {
                                const name = file.replace(".js", "").toLowerCase();
                                const cfg = plugin.config || { name, aliases: [] };
                                cfg.category = cat;

                                global.plugins.commands.set(name, plugin.onCall);
                                global.plugins.commandsConfig.set(name, cfg);
                                global.plugins.commandsAliases.set(name, cfg.aliases || [name]);
                                count++;
                            }
                        } catch (e) {
                            console.error(`LoadAll error ${file}:`, e);
                        }
                    }
                }
                return message.reply(getLang("loadall.success", { count }));
            } catch (err) {
                return message.reply(getLang("loadall.failed"));
            }
        }

        // ===================== UNLOAD =====================
        if (action === "unload" && args[1]) {
            const name = args[1].toLowerCase().replace(".js", "");
            if (global.plugins.commands.has(name)) {
                global.plugins.commands.delete(name);
                global.plugins.commandsConfig.delete(name);
                global.plugins.commandsAliases.delete(name);
                return message.reply(getLang("unload.success", { name }));
            }
            return message.reply(getLang("unload.notfound", { name }));
        }

    } catch (e) {
        console.error("CMD fatal error:", e);
        message.reply(`Fatal error: ${e.message}`);
    }
}

export default { config, langData, onCall };

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runEntrypoint = runEntrypoint;
const tslib_1 = require("tslib");
/* eslint-disable n/no-process-exit */
const versions_js_1 = require("./host-api/versions.js");
const promises_1 = tslib_1.__importDefault(require("fs/promises"));
const util_js_1 = require("./util.js");
const ipc_wrapper_js_1 = require("./host-api/ipc-wrapper.js");
const path_1 = tslib_1.__importDefault(require("path"));
let hasEntrypoint = false;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let moduleInstance;
// async function readFileUrl(url: URL): Promise<string> {
// 	// Hack to make json files be loadable after being inlined by webpack
// 	const prefix = 'application/json;base64,'
// 	if (url.pathname.startsWith(prefix)) {
// 		const base64 = url.pathname.substring(prefix.length)
// 		return Buffer.from(base64, 'base64').toString()
// 	}
// 	// Fallback to reading from disk
// 	const buf = await fs.readFile(url)
// 	return buf.toString()
// }
/**
 * Setup the module for execution
 * This should be called once per-module, to register the class that should be executed
 * @param factory The class for the module
 * @param upgradeScripts Upgrade scripts
 */
function runEntrypoint(factory, upgradeScripts) {
    Promise.resolve()
        .then(async () => {
        // const pkgJsonStr = (await fs.readFile(path.join(__dirname, '../package.json'))).toString()
        // const pkgJson = JSON.parse(pkgJsonStr)
        // if (!pkgJson || pkgJson.name !== '@companion-module/base')
        // 	throw new Error('Failed to find the package.json for @companion-module/base')
        // if (!pkgJson.version) throw new Error('Missing version field in the package.json for @companion-module/base')
        // Ensure only called once per module
        if (hasEntrypoint)
            throw new Error(`runEntrypoint can only be called once`);
        hasEntrypoint = true;
        // Validate that the upgrade scripts look sane
        if (!upgradeScripts)
            upgradeScripts = [];
        if (!Array.isArray(upgradeScripts))
            throw new Error('upgradeScripts must be an array');
        for (const upgradeScript of upgradeScripts) {
            if (typeof upgradeScript !== 'function')
                throw new Error('upgradeScripts must be an array of functions');
        }
        const manifestPath = process.env.MODULE_MANIFEST;
        if (!manifestPath)
            throw new Error('Module initialise is missing MODULE_MANIFEST');
        // check manifest api field against apiVersion
        const manifestBlob = await promises_1.default.readFile(manifestPath);
        const manifestJson = JSON.parse(manifestBlob.toString());
        if (manifestJson.runtime?.api !== versions_js_1.HostApiNodeJsIpc)
            throw new Error(`Module manifest 'api' mismatch`);
        if (!manifestJson.runtime.apiVersion)
            throw new Error(`Module manifest 'apiVersion' missing`);
        let apiVersion = manifestJson.runtime.apiVersion;
        if (apiVersion === '0.0.0') {
            // It looks like the module is in dev mode. lets attempt to load the package.json from this module instead
            try {
                const baseJsonStr = await promises_1.default.readFile(path_1.default.join(__dirname, '../package.json'));
                const baseJson = JSON.parse(baseJsonStr.toString());
                if (baseJson.name === '@companion-module/base') {
                    apiVersion = baseJson.version;
                }
            }
            catch (_e) {
                throw new Error('Failed to determine module api version');
            }
        }
        if (!process.send)
            throw new Error('Module is not being run with ipc');
        console.log(`Starting up module class: ${factory.name}`);
        const connectionId = process.env.CONNECTION_ID;
        if (typeof connectionId !== 'string' || !connectionId)
            throw new Error('Module initialise is missing CONNECTION_ID');
        const verificationToken = process.env.VERIFICATION_TOKEN;
        if (typeof verificationToken !== 'string' || !verificationToken)
            throw new Error('Module initialise is missing VERIFICATION_TOKEN');
        // Allow the DSN to be provided as an env variable
        // const sentryDsn = process.env.SENTRY_DSN
        // const sentryUserId = process.env.SENTRY_USERID
        // const sentryCompanionVersion = process.env.SENTRY_COMPANION_VERSION
        // if (sentryDsn && sentryUserId && sentryDsn.substring(0, 8) == 'https://') {
        // 	console.log('Sentry enabled')
        // 	init({
        // 		dsn: sentryDsn,
        // 		release: `${manifestJson.name}@${manifestJson.version}`,
        // 		beforeSend(event) {
        // 			if (event.exception) {
        // 				console.log('sentry', 'error', event.exception)
        // 			}
        // 			return event
        // 		},
        // 	})
        // 	{
        // 		const scope = getCurrentScope()
        // 		scope.setUser({ id: sentryUserId })
        // 		scope.setTag('companion', sentryCompanionVersion)
        // 	}
        // } else {
        // 	console.log('Sentry disabled')
        // }
        const ipcWrapper = new ipc_wrapper_js_1.IpcWrapper({}, (msg) => {
            process.send(msg);
        }, 5000);
        process.once('message', (msg) => {
            ipcWrapper.receivedMessage(msg);
        });
        moduleInstance = new factory((0, util_js_1.literal)({
            id: connectionId,
            upgradeScripts,
            _isInstanceBaseProps: true,
        }));
        ipcWrapper.sendWithCb('register', { apiVersion, connectionId, verificationToken }).then(() => {
            console.log(`Module-host accepted registration`);
        }, (err) => {
            console.error('Module registration failed', err);
            // Kill the process
            process.exit(11);
        });
    })
        .catch((e) => {
        console.error(`Failed to startup module:`);
        console.error(e.stack || e.message);
        process.exit(1);
    });
}
//# sourceMappingURL=entrypoint.js.map
export function getDevLogger() {
    let start = Date.now();
    let last = start;
    let lastAction;

    return (action, fromStart = false) => {
        if (fromStart) {
            console.log(`action ${lastAction} ~ action ${action} cost:` + (Date.now() - last));
        } else {
            console.log(`start ~ action ${action} cost:` + ( Date.now() - start));
        }
        last = Date.now()
    }
}
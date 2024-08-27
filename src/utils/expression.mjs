const expressionRegex = /^(?:(?<INTERVAL_FROM>\d+)-(?<INTERVAL_TO>\d+):|(?<EQ>\d+):|<(?<LT>\d+):|<=(?<LTE>\d+):|>(?<GT>\d+):|>=(?<GTE>\d+):)?(?<VALUE>[^:\s]+)$/;
const parsedExpressionsCache = {}

export function parseExpression (expression) {
    if (expression in parsedExpressionsCache) {
        return parsedExpressionsCache[expression];
    }

    const parts = expression.split(',').map(exp => exp.trim());
    const rules = [];

    for (let i = 0; i < parts.length; i++) {
        const part = parts[i];

        const matches = part.match(expressionRegex);

        if (null === matches || undefined === matches.groups || undefined === matches.groups.VALUE) {
            continue;
        }

        let rule;

        switch (true) {
            case undefined !== matches.groups.INTERVAL_FROM && undefined !== matches.groups.INTERVAL_TO:
                rule = {
                    from: parseInt(matches.groups.INTERVAL_FROM),
                    to: parseInt(matches.groups.INTERVAL_TO),
                    matches: function (index) {
                        return index >= this.from && index <= this.to;
                    },
                };
                break;
            case undefined !== matches.groups.EQ:
                rule = {
                    eq: parseInt(matches.groups.EQ),
                    matches: function (index) {
                        return index === this.eq;
                    },
                };
                break;
            case undefined !== matches.groups.LT:
                rule = {
                    lt: parseInt(matches.groups.LT),
                    matches: function (index) {
                        return index < this.lt;
                    },
                };
                break;
            case undefined !== matches.groups.LTE:
                rule = {
                    lte: parseInt(matches.groups.LTE),
                    matches: function (index) {
                        return index <= this.lte;
                    },
                };
                break;
            case undefined !== matches.groups.GT:
                rule = {
                    gt: parseInt(matches.groups.GT),
                    matches: function (index) {
                        return index > this.gt;
                    },
                };
                break;
            case undefined !== matches.groups.GTE:
                rule = {
                    gte: parseInt(matches.groups.GTE),
                    matches: function (index) {
                        return index >= this.gte;
                    },
                };
                break;
            default:
                rule = {
                    matches: function () {
                        return true;
                    },
                };
        }

        if (rule) {
            rule.matches = rule.matches.bind(rule);
            rule.value = matches.groups.VALUE;
            rules.push(rule);
        }
    }

    const parsedExpression = {
        rules: rules,
        cache: {},
    }

    parsedExpression.evaluate = (function (index) {
        if (!Number.isInteger(index)) {
            index = parseInt(index);
        }

        const cacheKey = `i_${index}`;

        if (cacheKey in this.cache) {
            return this.cache[cacheKey];
        }

        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];

            if (rule.matches(index)) {
                return this.cache[cacheKey] = rule.value;
            }
        }

        return this.cache[cacheKey] = null;
    }).bind(parsedExpression);

    parsedExpressionsCache[expression] = parsedExpression;

    return parsedExpression;
}

export function evaluateExpression (expression, index) {
    const parsedExpression = parseExpression(expression);

    return parsedExpression.evaluate(index);
}

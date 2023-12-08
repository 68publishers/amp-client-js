export class Randomizer {

    static randomByWeights(items, weightProperty = 'weight') {
        const distributions = {};
        let weightTotal = 0;

        for (let i = 0; i < items.length; i++) {
            weightTotal += items[i][weightProperty];
        }

        for (let i = 0; i < items.length; i++) {
            distributions[i] = items[i][weightProperty] / weightTotal;
        }

        let key = 0,
            selector = Math.random();

        while (selector > 0) {
            selector -= distributions[key];
            key++;
        }

        key--;

        return items[key] ? items[key] : items[0];
    }
}

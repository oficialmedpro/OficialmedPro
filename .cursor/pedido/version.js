// 📦 VERSÃO DO SISTEMA - OFICIALMED PEDIDOS
// Este arquivo é atualizado automaticamente antes de cada commit
// Formato: MAJOR.MINOR.PATCH (ex: 1.2.1)

const VERSION = {
    major: 1,
    minor: 2,
    patch: 5,
    toString: function() {
        return `${this.major}.${this.minor}.${this.patch}`;
    },
    getFullVersion: function() {
        return `OficialMed Pedidos V ${this.toString()}`;
    }
};

// Tornar disponível globalmente
window.VERSION = VERSION;
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VERSION;
}

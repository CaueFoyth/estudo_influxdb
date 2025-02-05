const axios = require('axios');

// Configurações do InfluxDB
const token = 'TOKEN';
const url = 'http://localhost:8086';
const org = 'myorg';
const bucket = 'mybucket';

const headers = {
    Authorization: `Token ${token}`,
    'Content-Type': 'text/plain', // Necessário para o Line Protocol
};

// ✅ Função para converter DTOs para Line Protocol
function convertToLineProtocol(createSendingDto) {
    const lines = [];

    createSendingDto.readings.forEach((reading) => {
        reading.tpmsReadings.forEach((tpms) => {
            const timestamp = new Date(reading.dateTime).getTime() * 1_000_000; // Nanosegundos

            const line = `tpms_data,imei=${createSendingDto.imei},tireSensorId=${tpms.tpmsSensorId},tirePosition=${tpms.tpmsTirePosition.position},trailer=${tpms.tpmsTirePosition.trailer} ` +
                `tirePressure=${tpms.tirePressure},tireTemperature=${tpms.tireTemperature},` +
                `lowBattery=${tpms.tpmsSensorStatus.lowBattery ? 1 : 0},notReceivingData=${tpms.tpmsSensorStatus.notReceivingData ? 1 : 0},` +
                `highPressure=${tpms.tpmsSensorStatus.highPressure ? 1 : 0},lowPressure=${tpms.tpmsSensorStatus.lowPressure ? 1 : 0},` +
                `highTemperature=${tpms.tpmsSensorStatus.highTemperature ? 1 : 0},tireStatus="${tpms.tpmsSensorStatus.tireStatus}" ` +
                `${timestamp}`;

            lines.push(line);
        });
    });

    return lines.join("\n");
}

// ✅ Função para enviar dados para o InfluxDB
async function insertData(createSendingDto) {
    try {
        const payload = convertToLineProtocol(createSendingDto);
        const response = await axios.post(`${url}/api/v2/write?org=${org}&bucket=${bucket}&precision=ns`, payload, { headers });
        console.log('✅ Dados inseridos com sucesso!', response.status);
    } catch (error) {
        console.error('❌ Erro ao inserir dados:', error.response ? error.response.data : error.message);
    }
}

// ✅ Função para gerar dados aleatórios
function generateRandomData() {
    return {
        id: Math.random().toString(36).substring(7),
        imei: (Math.floor(Math.random() * 1000000000000000) + 100000000000000).toString(),
        receivedAt: new Date().toISOString(),
        readings: [
            {
                id: `reading-${Math.random().toString(36).substring(7)}`,
                priority: Math.floor(Math.random() * 5) + 1,
                dateTime: new Date().toISOString(),
                gpsElement: {
                    longitude: (Math.random() * 360 - 180).toFixed(6),
                    latitude: (Math.random() * 180 - 90).toFixed(6),
                    altitude: Math.floor(Math.random() * 5000),
                    angle: Math.floor(Math.random() * 360),
                    satellites: Math.floor(Math.random() * 20) + 1,
                    speed: Math.floor(Math.random() * 120),
                },
                properties: [
                    { id: 1, propertyName: "Fuel", value: Math.floor(Math.random() * 100) },
                    { id: 2, propertyName: "Battery", value: ["Good", "Low", "Critical"][Math.floor(Math.random() * 3)] },
                ],
                tpmsReadings: [
                    {
                        id: `tpms-${Math.random().toString(36).substring(7)}`,
                        tpmsTirePosition: { trailer: Math.floor(Math.random() * 3), position: Math.floor(Math.random() * 10) },
                        tirePressure: (Math.random() * 100).toFixed(1),
                        tireTemperature: (Math.random() * 150).toFixed(1),
                        tpmsSensorId: `sensor-${Math.random().toString(36).substring(7)}`,
                        tpmsSensorStatus: {
                            lowBattery: Math.random() < 0.2,
                            notReceivingData: Math.random() < 0.1,
                            highPressure: Math.random() < 0.15,
                            lowPressure: Math.random() < 0.15,
                            highTemperature: Math.random() < 0.1,
                            tireStatus: ["OK", "LOW_PRESSURE", "HIGH_PRESSURE", "HIGH_TEMPERATURE"][Math.floor(Math.random() * 4)],
                        },
                    },
                ],
            },
        ],
    };
}

// ✅ Loop infinito para enviar dados aleatórios a cada 5 segundos
setInterval(() => {
    const data = generateRandomData();
    insertData(data);
}, 5000); // Envia os dados a cada 5 segundos

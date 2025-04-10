import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { parse } from "csv-parse/sync";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    throw new Error("API_KEY is required. Please set it in your environment.");
}
// 获取当前文件的目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export function createServer() {
    const server = new McpServer({
        name: "Weather MCP Server",
        version: "0.1.0",
    });
    server.tool("get_weather", "Get weather info for a given city.", {
        city: z.string().describe("city name"),
    }, async ({ city }) => {
        if (!city) {
            throw new Error("city name is required.");
        }
        const weather = await getWeather(city);
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify(weather, null, 2),
                },
            ],
        };
    });
    return server;
}
export const getWeather = async (city) => {
    const location = findLocationId(city);
    if (!location) {
        return {
            content: [
                {
                    type: "text",
                    text: `城市 ${city} 不在列表中`,
                },
            ],
        };
    }
    const url = `https://nh3tefdpke.re.qweatherapi.com/v7/weather/now?location=${encodeURIComponent(location)}&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        const weatherData = await response.json();
        console.log("天气数据:", weatherData);
        console.log("当前天气:", weatherData.now);
        return weatherData.now;
    }
    catch (error) {
        console.error("请求失败:", error);
    }
    return null;
};
const filePath = path.resolve(__dirname, "../China-City-List-latest.csv");
let records = [];
try {
    const content = await fs.readFile(filePath, "utf-8");
    records = parse(content, {
        bom: true,
        columns: true,
        skip_empty_lines: true,
    });
}
catch (error) {
    console.error("Error reading the file:", error);
}
export const findLocationId = (city) => {
    const isEnglish = /^[a-zA-Z\s]+$/.test(city);
    let target = null;
    if (isEnglish) {
        target = records.find(record => record.Adm1_Name_EN === city || record.Adm2_Name_EN === city);
    }
    else {
        target = records.find(record => record.Adm1_Name_ZH.includes(city) || record.Adm2_Name_ZH.includes(city));
    }
    if (target) {
        return target.Location_ID;
    }
    return null;
};
//# sourceMappingURL=server.js.map
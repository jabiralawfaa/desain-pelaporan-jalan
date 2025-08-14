import { writeFile } from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    const data = await request.formData();
    const file = data.get("file") as File;

    if(!file) {
        return NextResponse.json({
            success: false,
            error: "No file uploaded!"
        }, {
            status: 400
        });
    }

    const yoloResponse = await fetch("http://127.0.0.1:5000/detect", {
        method: "POST",
        body: data
    });

    if (!yoloResponse.ok) {
        const error = await yoloResponse.json();
        return NextResponse.json({
            success: false,
            error: error.error
        }, {
            status: yoloResponse.status
        });
    }

    const yoloData = await yoloResponse.json();

    const labelFileName = `${path.parse(file.name).name}.json`;

    const uploadDir = path.join(process.cwd(), "public", "result");
    const filePath = path.join(uploadDir, labelFileName);

    try {
        await writeFile(filePath, JSON.stringify(yoloData, null, 2));
        return NextResponse.json({
            success: true,
            message: "File processed and saved successfully!",
            labelPath: `/result/${labelFileName}`,
            imageWidth: yoloData.width,
            imageHeight: yoloData.height
        });
    } catch (error) {
        return NextResponse.json({
            success: false,
            error: error
        });
    }
}
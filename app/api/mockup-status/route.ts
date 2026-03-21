import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const predictionId = searchParams.get("predictionId");
  const mockupId = searchParams.get("mockupId");

  if (!predictionId) {
    return NextResponse.json({ error: "Missing predictionId" }, { status: 400 });
  }

  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const prediction = await replicate.predictions.get(predictionId);

    if (prediction.status === "succeeded") {
      const generatedImageUrl = Array.isArray(prediction.output)
        ? prediction.output[0]
        : prediction.output;

      if (!generatedImageUrl) {
        return NextResponse.json({ status: "failed", error: "No output from Replicate" });
      }

      const generatedResponse = await fetch(generatedImageUrl);
      const generatedBuffer = await generatedResponse.arrayBuffer();

      const afterPath = `mockups/${Date.now()}-after.webp`;
      await supabase.storage
        .from("stackedwork-images")
        .upload(afterPath, generatedBuffer, { contentType: "image/webp" });

      const { data: afterUrlData } = supabase.storage
        .from("stackedwork-images")
        .getPublicUrl(afterPath);

      if (mockupId) {
        await supabase
          .from("mockups")
          .update({ after_url: afterUrlData.publicUrl, status: "completed" })
          .eq("id", mockupId);
      }

      return NextResponse.json({ status: "succeeded", afterUrl: afterUrlData.publicUrl });
    }

    if (prediction.status === "failed" || prediction.status === "canceled") {
      if (mockupId) {
        await supabase.from("mockups").update({ status: "failed" }).eq("id", mockupId);
      }
      const rawError = String((prediction as any).error || "");
      const isOOM = rawError.toLowerCase().includes("cuda") || rawError.toLowerCase().includes("out of memory");
      return NextResponse.json({
        status: "failed",
        error: isOOM
          ? "Generation failed due to high server load. Please try again."
          : "Generation failed. Please try again.",
      });
    }

    return NextResponse.json({ status: prediction.status });
  } catch (error: any) {
    console.error("Status check error:", error);
    return NextResponse.json({ error: error?.message || "Status check failed" }, { status: 500 });
  }
}

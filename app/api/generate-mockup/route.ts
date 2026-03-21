import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const PROMPTS = {
  bathroom: {
    "Modern Minimalist": "renovate this bathroom in a modern minimalist style with clean white tile, floating vanity, frameless glass shower, and matte black fixtures",
    "Classic Traditional": "renovate this bathroom in a classic traditional style with a warm wood vanity, subway tile, brushed nickel fixtures, framed mirror, and wainscoting",
    "Industrial": "renovate this bathroom in an industrial style with exposed pipe fixtures, concrete countertop, and black metal accents",
    "Farmhouse": "renovate this bathroom in a farmhouse style with shiplap walls, a vessel sink, rustic wood accents, and a vintage faucet",
  },
  kitchen: {
    "Modern Minimalist": "renovate this kitchen in a modern minimalist style with white quartz countertops, handleless cabinets, pendant lighting, and a waterfall island",
    "Classic Traditional": "renovate this kitchen in a classic traditional style with shaker cabinets, granite countertops, stainless steel appliances, and crown molding",
    "Industrial": "renovate this kitchen in an industrial style with open shelving, stainless steel surfaces, exposed brick, and pendant cage lights",
    "Farmhouse": "renovate this kitchen in a farmhouse style with open shelving, an apron sink, butcher block counters, and vintage hardware",
  },
  paint: {
    "Modern Minimalist": "repaint this room in a modern minimalist style with clean neutral tones and a smooth finish",
    "Classic Traditional": "repaint this room in a classic traditional style with warm earth tones and elegant trim",
    "Industrial": "repaint this room in an industrial style with a dark charcoal accent wall",
    "Farmhouse": "repaint this room in a farmhouse style with soft white and sage green and a shiplap accent wall",
  },
  exterior: {
    "Modern Minimalist": "renovate this home exterior in a modern minimalist style with clean siding, contemporary landscaping, and a new front door",
    "Classic Traditional": "renovate this home exterior in a classic traditional style with fresh paint, manicured landscaping, classic shutters, and a welcoming porch",
    "Industrial": "renovate this home exterior in an industrial modern style with mixed materials and metal accents",
    "Farmhouse": "renovate this home exterior in a farmhouse style with board and batten siding, a wraparound porch, black windows, and a landscaped garden",
  },
  deck: {
    "Modern Minimalist": "add a modern composite deck with clean lines, cable railing, and built-in lighting",
    "Classic Traditional": "add a classic cedar wood deck with turned balusters, built-in seating, and a warm stain finish",
    "Industrial": "add an industrial deck with metal railing and dark composite boards",
    "Farmhouse": "add a farmhouse deck with whitewashed wood, X-pattern railing, and rocking chairs",
  },
  other: {
    "Modern Minimalist": "renovate this space in a modern minimalist style with clean contemporary design and quality materials",
    "Classic Traditional": "renovate this space in a classic traditional style with warm design and quality craftsmanship",
    "Industrial": "renovate this space in an industrial style with raw materials and exposed elements",
    "Farmhouse": "renovate this space in a farmhouse style with rustic charm and natural materials",
  },
};


export async function POST(request) {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const jobType = formData.get("jobType") || "other";
    const style = formData.get("style") || "Modern Minimalist";
    const customerId = formData.get("customerId");
    const jobId = formData.get("jobId");
    const contractorId = formData.get("userId");

    if (!imageFile) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: "REPLICATE_API_TOKEN not configured" }, { status: 500 });
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: "SUPABASE_SERVICE_ROLE_KEY not configured" }, { status: 500 });
    }

    const timestamp = Date.now();
    const ext = imageFile.type.split("/")[1] || "jpeg";
    const beforePath = `mockups/${timestamp}-before.${ext}`;

    // Upload original image to Supabase first so we have a real URL for Replicate
    const bytes = await imageFile.arrayBuffer();
    const { error: uploadError } = await supabase.storage
      .from("stackedwork-images")
      .upload(beforePath, bytes, { contentType: imageFile.type });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      return NextResponse.json({ error: `Storage upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: beforeUrlData } = supabase.storage.from("stackedwork-images").getPublicUrl(beforePath);
    const typeKey = jobType.toLowerCase().replace(/[^a-z]/g, "");
    const prompt = PROMPTS[typeKey]?.[style] || PROMPTS["other"]["Modern Minimalist"];

    const output = await replicate.run(
      "timothybrooks/instruct-pix2pix:30c1d0b916a6f8efce20493f5d61ee27491ab2a60b7a6c9e0e4e1be87e5376b4",
      {
        input: {
          image: beforeUrlData.publicUrl,
          prompt: prompt,
          num_inference_steps: 30,
          image_guidance_scale: 1.5,
          guidance_scale: 7.5,
        },
      }
    );

    const generatedImageUrl = Array.isArray(output) ? output[0] : output;
    if (!generatedImageUrl) {
      return NextResponse.json({ error: "Replicate returned no output" }, { status: 500 });
    }

    const generatedResponse = await fetch(generatedImageUrl);
    const generatedBuffer = await generatedResponse.arrayBuffer();

    const afterPath = `mockups/${timestamp}-after.webp`;
    await supabase.storage.from("stackedwork-images").upload(afterPath, generatedBuffer, { contentType: "image/webp" });

    const { data: afterUrlData } = supabase.storage.from("stackedwork-images").getPublicUrl(afterPath);

    const { data: mockupRecord } = await supabase.from("mockups").insert({
      contractor_id: contractorId || null,
      customer_id: customerId || null,
      job_id: jobId || null,
      job_type: jobType,
      style: style,
      before_url: beforeUrlData.publicUrl,
      after_url: afterUrlData.publicUrl,
      prompt_used: prompt,
      strength: 0.65,
      status: "completed",
      created_at: new Date().toISOString(),
    }).select().single();

    return NextResponse.json({
      success: true,
      mockup: {
        id: mockupRecord?.id || timestamp,
        beforeUrl: beforeUrlData.publicUrl,
        afterUrl: afterUrlData.publicUrl,
        jobType, style,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("Mockup error:", error);
    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}

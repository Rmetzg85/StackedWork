import { NextResponse } from "next/server";
import Replicate from "replicate";
import { createClient } from "@supabase/supabase-js";

export const maxDuration = 60;

const PROMPTS = {
  bathroom: {
    "Modern Minimalist": "Modern minimalist bathroom renovation, clean white tile, floating vanity, frameless glass shower, matte black fixtures, LED mirror, professional interior design photography, 4k, realistic",
    "Classic Traditional": "Classic traditional bathroom renovation, warm wood vanity, subway tile, brushed nickel fixtures, framed mirror, wainscoting, professional interior design photography, 4k, realistic",
    "Industrial": "Industrial bathroom renovation, exposed pipe fixtures, concrete countertop, black metal accents, Edison bulb lighting, professional interior design photography, 4k, realistic",
    "Farmhouse": "Farmhouse bathroom renovation, shiplap walls, vessel sink, rustic wood accents, vintage faucet, warm lighting, professional interior design photography, 4k, realistic",
  },
  kitchen: {
    "Modern Minimalist": "Modern minimalist kitchen renovation, white quartz countertops, handleless cabinets, pendant lighting, waterfall island, professional interior design photography, 4k, realistic",
    "Classic Traditional": "Classic traditional kitchen renovation, shaker cabinets, granite countertops, stainless steel appliances, crown molding, professional interior design photography, 4k, realistic",
    "Industrial": "Industrial kitchen renovation, open shelving, stainless steel surfaces, exposed brick, pendant cage lights, butcher block island, professional interior design photography, 4k, realistic",
    "Farmhouse": "Farmhouse kitchen renovation, open shelving, apron sink, butcher block counters, beadboard ceiling, vintage hardware, professional interior design photography, 4k, realistic",
  },
  paint: {
    "Modern Minimalist": "Freshly painted modern interior, clean neutral tones, accent wall, smooth finish, bright natural light, professional interior design photography, 4k, realistic",
    "Classic Traditional": "Freshly painted traditional interior, warm earth tones, crown molding, elegant finish, professional interior design photography, 4k, realistic",
    "Industrial": "Freshly painted industrial loft interior, dark charcoal accent wall, exposed ceiling, professional interior design photography, 4k, realistic",
    "Farmhouse": "Freshly painted farmhouse interior, soft white and sage green, shiplap accent wall, warm lighting, professional interior design photography, 4k, realistic",
  },
  exterior: {
    "Modern Minimalist": "Modern home exterior renovation, clean siding, contemporary landscaping, new front door, pathway lighting, professional architectural photography, 4k, realistic",
    "Classic Traditional": "Traditional home exterior renovation, fresh paint, manicured landscaping, classic shutters, welcoming porch, professional architectural photography, 4k, realistic",
    "Industrial": "Industrial modern exterior renovation, mixed materials, metal accents, concrete pathway, professional architectural photography, 4k, realistic",
    "Farmhouse": "Farmhouse exterior renovation, board and batten siding, wraparound porch, black windows, landscaped garden, professional architectural photography, 4k, realistic",
  },
  deck: {
    "Modern Minimalist": "Modern composite deck build, clean lines, cable railing, built-in lighting, professional exterior photography, 4k, realistic",
    "Classic Traditional": "Classic wood deck build, cedar planks, turned balusters, built-in seating, warm stain finish, professional exterior photography, 4k, realistic",
    "Industrial": "Industrial deck build, metal railing, dark composite boards, minimalist furniture, string lights, professional exterior photography, 4k, realistic",
    "Farmhouse": "Farmhouse deck build, whitewashed wood, X-pattern railing, rocking chairs, hanging plants, professional exterior photography, 4k, realistic",
  },
  other: {
    "Modern Minimalist": "Modern home renovation, clean contemporary design, quality materials, professional finish, interior design photography, 4k, realistic",
    "Classic Traditional": "Traditional home renovation, warm classic design, quality craftsmanship, elegant finish, interior design photography, 4k, realistic",
    "Industrial": "Industrial home renovation, raw materials, exposed elements, modern fixtures, interior design photography, 4k, realistic",
    "Farmhouse": "Farmhouse home renovation, rustic charm, natural materials, warm inviting space, interior design photography, 4k, realistic",
  },
};

const NEG = "blurry, low quality, distorted, cartoon, anime, painting, drawing, sketch, unrealistic, watermark, text overlay, people, humans, faces";

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

    const prediction = await replicate.predictions.create({
      version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      input: {
        image: beforeUrlData.publicUrl,
        prompt: prompt,
        negative_prompt: NEG,
        prompt_strength: 0.6,
        num_inference_steps: 10,
        guidance_scale: 7.5,
        scheduler: "K_EULER",
        width: 512,
        height: 512,
        refine: "no_refiner",
      },
    });

    const { data: mockupRecord } = await supabase.from("mockups").insert({
      contractor_id: contractorId || null,
      customer_id: customerId || null,
      job_id: jobId || null,
      job_type: jobType,
      style: style,
      before_url: beforeUrlData.publicUrl,
      after_url: null,
      prompt_used: prompt,
      strength: 0.65,
      status: "pending",
      created_at: new Date().toISOString(),
    }).select().single();

    return NextResponse.json({
      success: true,
      predictionId: prediction.id,
      mockupId: mockupRecord?.id || null,
      beforeUrl: beforeUrlData.publicUrl,
      jobType,
      style,
    });
  } catch (error: any) {
    console.error("Mockup error:", error);
    return NextResponse.json({ error: error?.message || "Something went wrong" }, { status: 500 });
  }
}

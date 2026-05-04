"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PreSurvey() {
  const [loading, setLoading] = useState(false);

  const searchParams = useSearchParams();
  const programmeId = searchParams.get("programme_id");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const form = e.target;

    const data = {
      familiarity: form[0].value,
      expectations: form[1].value,
      source: form[2].value,
      role: form[3].value,
      skills: form[4].value,
      suggestions: form[5].value,
    };

    // ✅ get logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("surveys").insert([
      {
        type: "pre",
        answers: data,
        completed: true,
        user_id: user?.id,
        programme_id: programmeId,
      },
    ]);

    setLoading(false);

    if (error) {
      console.log(error);
      alert("Failed to submit survey");
    } else {
      alert("Pre-survey submitted successfully!");
      form.reset();
    }
  };

  const inputClass =
    "w-full border border-gray-300 bg-white text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="p-6 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-2">
        Pre-Programme Survey
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        Please complete this survey before the programme starts.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block mb-1 font-medium">
            1. How familiar are you with the programme topic?
          </label>
          <select className={inputClass}>
            <option value="">Select rating</option>
            <option>1 - Not familiar</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5 - Very familiar</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            2. What are your expectations from this programme?
          </label>
          <textarea className={inputClass} rows={3} />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            3. How did you hear about this programme?
          </label>
          <select className={inputClass}>
            <option value="">Select option</option>
            <option>WhatsApp</option>
            <option>Friends</option>
            <option>Poster</option>
            <option>Lecturer</option>
            <option>Other</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            4. What is your role in this programme?
          </label>
          <select className={inputClass}>
            <option>Participant</option>
            <option>Committee Member</option>
            <option>Observer</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            5. What skills do you hope to gain?
          </label>
          <textarea className={inputClass} rows={3} />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            6. Suggestions before programme starts
          </label>
          <textarea className={inputClass} rows={3} />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
        >
          {loading ? "Submitting..." : "Submit Pre-Survey"}
        </button>

      </form>
    </div>
  );
}
"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function PostSurvey() {
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
      experience: form[2].value,
      participation: form[3].value,
      skills: form[4].value,
      suggestions: form[5].value,
    };

    // ✅ get logged-in user
    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from("surveys").insert([
      {
        type: "post",
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
      alert("Post-survey submitted successfully!");
      form.reset();
    }
  };

  const inputClass =
    "w-full border border-gray-300 bg-white text-gray-900 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400";

  return (
    <div className="p-6 max-w-xl mx-auto">

      <h1 className="text-2xl font-bold mb-2">
        Post-Programme Survey
      </h1>

      <p className="text-sm text-gray-500 mb-4">
        Please complete this survey after the programme ends.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="block mb-1 font-medium">
            1. How familiar are you after the programme?
          </label>
          <select className={inputClass}>
            <option>1 - Not familiar</option>
            <option>2</option>
            <option>3</option>
            <option>4</option>
            <option>5 - Very familiar</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            2. Did the programme meet expectations?
          </label>
          <textarea className={inputClass} rows={3} />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            3. Overall experience
          </label>
          <select className={inputClass}>
            <option>Excellent</option>
            <option>Good</option>
            <option>Average</option>
            <option>Poor</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            4. Did you participate actively?
          </label>
          <select className={inputClass}>
            <option>Yes</option>
            <option>No</option>
          </select>
        </div>

        <div>
          <label className="block mb-1 font-medium">
            5. Skills gained
          </label>
          <textarea className={inputClass} rows={3} />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            6. Suggestions for improvement
          </label>
          <textarea className={inputClass} rows={3} />
        </div>

        <button
          type="submit"
          className="w-full bg-green-500 text-white py-2 rounded-md hover:bg-green-600"
        >
          {loading ? "Submitting..." : "Submit Post-Survey"}
        </button>

      </form>
    </div>
  );
}
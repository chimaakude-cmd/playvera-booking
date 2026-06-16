"use client";

import { useEffect, useState } from "react";
import { LoadingState } from "@/components/club/LoadingState";
import { PageHeader } from "@/components/club/PageHeader";
import { ChildForm } from "@/components/parent/ChildForm";
import {
  calculateAge,
  ChildInput,
  ChildProfile,
  getChildren,
  isMedicalReviewDue,
  markChildMedicalReviewed,
  saveChild,
  updateChild,
} from "@/lib/children";

export default function ParentChildrenPage() {
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  function loadChildren() {
    setChildren(getChildren());
    setLoading(false);
  }

  useEffect(() => {
    loadChildren();
  }, []);

  function handleAddChild(data: ChildInput) {
    saveChild(data);
    setShowAddForm(false);
    loadChildren();
  }

  function handleUpdateChild(id: string, data: ChildInput) {
    updateChild(id, data);
    setEditingId(null);
    loadChildren();
  }

  if (loading) {
    return <LoadingState message="Loading children..." />;
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Children"
        description="Manage your children's profiles, medical information, and emergency contacts."
        action={
          !showAddForm ? (
            <button
              type="button"
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
              }}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
            >
              Add child
            </button>
          ) : null
        }
      />

      {showAddForm ? (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-900">
            Add child profile
          </h2>
          <ChildForm
            submitLabel="Save child"
            onSubmit={handleAddChild}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      ) : null}

      {children.length === 0 && !showAddForm ? (
        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-14 text-center">
          <h3 className="text-base font-semibold text-zinc-900">
            No children saved yet
          </h3>
          <p className="mt-2 text-sm text-zinc-500">
            Add a child profile to store medical details and emergency contacts.
          </p>
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="mt-6 inline-flex rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-800"
          >
            Add child
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {children.map((child) => (
            <article
              key={child.id}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"
            >
              {editingId === child.id ? (
                <div>
                  <h2 className="mb-4 text-lg font-semibold text-zinc-900">
                    Edit {child.fullName}
                  </h2>
                  <ChildForm
                    initialValues={child}
                    submitLabel="Save changes"
                    onSubmit={(data) => handleUpdateChild(child.id, data)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-zinc-900">
                        {child.fullName}
                      </h2>
                      <p className="mt-1 text-sm text-zinc-500">
                        Age {calculateAge(child.dateOfBirth)} · Born{" "}
                        {new Date(child.dateOfBirth).toLocaleDateString("en-GB")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(child.id);
                        setShowAddForm(false);
                      }}
                      className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                    >
                      Edit details
                    </button>
                  </div>

                  {isMedicalReviewDue(child) ? (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Medical, SEN, or allergy information has not been reviewed
                      in the last 6 months.
                      <button
                        type="button"
                        onClick={() => {
                          markChildMedicalReviewed(child.id);
                          loadChildren();
                        }}
                        className="mt-3 block rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-amber-800"
                      >
                        Mark as reviewed today
                      </button>
                    </div>
                  ) : null}

                  <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-zinc-500">Medical conditions</dt>
                      <dd className="font-medium text-zinc-900">
                        {child.medicalConditions || "None listed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">SEN / additional needs</dt>
                      <dd className="font-medium text-zinc-900">
                        {child.senNeeds || "None listed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Allergies</dt>
                      <dd className="font-medium text-zinc-900">
                        {child.allergies || "None listed"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-zinc-500">Emergency contact</dt>
                      <dd className="font-medium text-zinc-900">
                        {child.emergencyContactName || "Not set"}
                        {child.emergencyContactPhone
                          ? ` · ${child.emergencyContactPhone}`
                          : ""}
                      </dd>
                    </div>
                  </dl>
                </>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

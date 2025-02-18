/*
 * Copyright (c) 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 *
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v2.0
 * which accompanies this distribution, and is available at
 * http://www.eclipse.org/legal/epl-v20.html
 *
 * SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and Eclipse Dirigible contributors
 * SPDX-License-Identifier: EPL-2.0
 */
package org.eclipse.dirigible.engine.odata2.definition;

import java.util.HashMap;
import java.util.Map;

/**
 * The Class ODataNavigation.
 */
public class ODataNavigation {

    /** The name. */
    private String name;

    /** The association. */
    private String association;

    /**
     * <p>Define list of additional annotations for NavigationProperty element.</p>
     * For example:
     * <code> &lt;NavigationProperty Name="SomeName" Relationship="SomeRel" FromRole="FromRoleName" ToRole="ToRoleName" sap:filterable="false"/&gt; </code>
     */
    private Map<String ,String> annotationsNavigationProperty = new HashMap<>();

	/**
	 * Gets the name.
	 *
	 * @return the name
	 */
	public String getName() {
		return name;
	}

	/**
	 * Sets the name.
	 *
	 * @param name the new name
	 */
	public void setName(String name) {
		this.name = name;
	}

	/**
	 * Gets the association.
	 *
	 * @return the association
	 */
	public String getAssociation() {
		return association;
	}

	/**
	 * Sets the association.
	 *
	 * @param association the new association
	 */
	public void setAssociation(String association) {
		this.association = association;
	}

	/**
	 * Gets the annotations navigation property.
	 *
	 * @return the annotations navigation property
	 */
	public Map<String, String> getAnnotationsNavigationProperty() {
		return annotationsNavigationProperty;
	}

	/**
	 * Sets the annotations navigation property.
	 *
	 * @param annotationsNavigationProperty the annotations navigation property
	 */
	public void setAnnotationsNavigationProperty(Map<String, String> annotationsNavigationProperty) {
		this.annotationsNavigationProperty = annotationsNavigationProperty;
	}
    
}
